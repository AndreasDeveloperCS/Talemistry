import { Injectable } from '@nestjs/common';
import { CurrentCompanyService } from '../../companies/services/current-company.service';
import { UsersService } from '../../users/services/user.service';
import {
    MetadataMap,
    PaymentBillingContact,
    PaymentEventRecord,
    PaymentSubscriptionState,
    PaymentProvider,
} from '../dto/payments.dto';
import { PaymentsCatalogService } from './payments-catalog.service';

@Injectable()
export class PaymentsStateService {
    constructor(
        private readonly usersService: UsersService,
        private readonly currentCompanyService: CurrentCompanyService,
        private readonly paymentsCatalogService: PaymentsCatalogService,
    ) { }

    async getCurrentSubscriptionState(userId: string): Promise<PaymentSubscriptionState | null> {
        const state = await this.usersService.getPaymentSubscriptionState(userId);
        return state || null;
    }

    async getCurrentCompanyId(userId: string): Promise<string | undefined> {
        const currentCompany = await this.currentCompanyService.getByUserIdAsync(userId);
        return currentCompany?.companyId ? String(currentCompany.companyId) : undefined;
    }

    createMetadata(metadata?: MetadataMap, userId?: string, companyId?: string): MetadataMap | undefined {
        const enrichedMetadata: MetadataMap = {
            ...(metadata || {}),
            ...(userId ? { userId } : {}),
            ...(companyId ? { companyId } : {}),
        };

        return Object.keys(enrichedMetadata).length > 0 ? enrichedMetadata : undefined;
    }

    async persistState(update: {
        provider?: PaymentProvider;
        userId?: string;
        companyId?: string;
        planId?: string;
        billingCycle?: 'monthly' | 'yearly';
        status?: string;
        customerId?: string;
        subscriptionId?: string;
        checkoutSessionId?: string;
        mandateId?: string;
        redirectFlowId?: string;
        amount?: number;
        currency?: string;
        billingContact?: PaymentBillingContact;
        metadata?: MetadataMap;
        lastEvent?: PaymentEventRecord;
    }): Promise<PaymentSubscriptionState | null> {
        const resolvedUserId = await this.resolveUserId(update);
        if (!resolvedUserId) {
            return null;
        }

        const existingState = await this.usersService.getPaymentSubscriptionState(resolvedUserId) || {};
        const resolvedCompanyId = update.companyId
            || this.getMetadataValue(update.metadata, 'companyId')
            || existingState.companyId
            || await this.getCurrentCompanyId(resolvedUserId);
        const planId = update.planId || this.getMetadataValue(update.metadata, 'planId') || existingState.planId;
        const plan = this.paymentsCatalogService.getPlan(planId);
        const metadata = this.mergeMetadata(existingState.metadata, update.metadata, resolvedUserId, resolvedCompanyId);
        const billingContact = this.mergeBillingContact(existingState.billingContact, update.billingContact);

        const nextState: PaymentSubscriptionState = {
            ...existingState,
            provider: update.provider || existingState.provider,
            planId,
            planName: this.getMetadataValue(update.metadata, 'planName') || plan?.name || existingState.planName,
            billingCycle: update.billingCycle || this.getMetadataValue(update.metadata, 'billingCycle') as 'monthly' | 'yearly' | undefined || existingState.billingCycle,
            status: update.status || existingState.status,
            customerId: update.customerId || existingState.customerId,
            subscriptionId: update.subscriptionId || existingState.subscriptionId,
            checkoutSessionId: update.checkoutSessionId || existingState.checkoutSessionId,
            mandateId: update.mandateId || existingState.mandateId,
            redirectFlowId: update.redirectFlowId || existingState.redirectFlowId,
            amount: typeof update.amount === 'number' ? update.amount : existingState.amount,
            currency: update.currency || existingState.currency,
            companyId: resolvedCompanyId,
            billingContact,
            metadata,
            lastEvent: update.lastEvent || existingState.lastEvent,
            updatedAt: new Date().toISOString(),
        };

        await this.usersService.upsertPaymentSubscriptionState(resolvedUserId, nextState);

        if (resolvedCompanyId) {
            await this.currentCompanyService.upsertPaymentSubscriptionStateByUserId(resolvedUserId, nextState);
        }

        return nextState;
    }

    async persistStripeWebhook(event: any): Promise<PaymentSubscriptionState | null> {
        const object = event?.data?.object || {};
        const metadata = this.extractMetadata(object);
        let subscriptionId: string | undefined;
        switch (event?.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                subscriptionId = this.getString(object.id);
                break;

            case 'checkout.session.completed':
            case 'invoice.paid':
            case 'invoice.payment_failed':
                subscriptionId = this.getString(object.subscription);
                break;
        }

        let status = this.getString(object.status);
        if (!status) {
            switch (event.type) {
                case 'invoice.paid':
                    status = 'active';
                    break;

                case 'invoice.payment_failed':
                    status = 'payment_failed';
                    break;

                case 'customer.subscription.deleted':
                    status = 'canceled';
                    break;
            }
        }

        return this.persistState({
            provider: 'stripe',
            metadata,
            status: status,
            customerId: this.getString(object.customer),
            subscriptionId: subscriptionId,
            checkoutSessionId: event?.type === 'checkout.session.completed' ? this.getString(object.id) : undefined,
            billingContact: {
                email: this.getString(object.customer_details?.email) || this.getString(object.customer_email) || this.getString(object.receipt_email),
                fullName: this.getString(object.customer_details?.name) || this.getString(object.customer_name),
            },
            lastEvent: {
                id: this.getString(event?.id),
                type: this.getString(event?.type),
                summary: this.getString(event?.type),
                processedAt: new Date().toISOString(),
            },
        });
    }

    async persistGoCardlessWebhook(events: Array<any>): Promise<void> {
        for (const event of events || []) {
            const metadata = this.extractMetadata(event?.details?.metadata) || this.extractMetadata(event?.metadata);
            await this.persistState({
                provider: 'gocardless',
                metadata,
                status: this.getString(event?.action),
                subscriptionId: this.getString(event?.links?.subscription),
                mandateId: this.getString(event?.links?.mandate),
                customerId: this.getString(event?.links?.customer),
                lastEvent: {
                    id: this.getString(event?.id),
                    action: this.getString(event?.action),
                    resourceType: this.getString(event?.resource_type || event?.resourceType),
                    summary: `${this.getString(event?.resource_type || event?.resourceType) || 'resource'}:${this.getString(event?.action) || 'updated'}`,
                    processedAt: new Date().toISOString(),
                },
            });
        }
    }

    private async resolveUserId(update: {
        userId?: string;
        customerId?: string;
        subscriptionId?: string;
        checkoutSessionId?: string;
        mandateId?: string;
        redirectFlowId?: string;
        metadata?: MetadataMap;
    }): Promise<string | undefined> {
        const directUserId = update.userId || this.getMetadataValue(update.metadata, 'userId');
        if (directUserId) {
            return directUserId;
        }

        const references = [
            update.subscriptionId,
            update.customerId,
            update.checkoutSessionId,
            update.mandateId,
            update.redirectFlowId,
        ].filter((value): value is string => !!String(value || '').trim());

        for (const reference of references) {
            const user = await this.usersService.findByPaymentReference(reference);
            if (user?._id) {
                return String(user._id);
            }
        }

        return undefined;
    }

    private mergeMetadata(
        existingMetadata?: MetadataMap,
        nextMetadata?: MetadataMap,
        userId?: string,
        companyId?: string,
    ): MetadataMap | undefined {
        const merged: MetadataMap = {
            ...(existingMetadata || {}),
            ...(nextMetadata || {}),
            ...(userId ? { userId } : {}),
            ...(companyId ? { companyId } : {}),
        };

        return Object.keys(merged).length > 0 ? merged : undefined;
    }

    private mergeBillingContact(
        existingBillingContact?: PaymentBillingContact,
        nextBillingContact?: PaymentBillingContact,
    ): PaymentBillingContact | undefined {
        const merged: PaymentBillingContact = {
            ...(existingBillingContact || {}),
            ...(nextBillingContact || {}),
        };

        return Object.values(merged).some((value) => typeof value === 'string' && value.trim())
            ? merged
            : undefined;
    }

    private extractMetadata(source: unknown): MetadataMap | undefined {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            return undefined;
        }

        return source as MetadataMap;
    }

    private getMetadataValue(metadata: MetadataMap | undefined, key: string): string | undefined {
        const value = metadata?.[key];
        return typeof value === 'undefined' ? undefined : String(value);
    }

    private getString(value: unknown): string | undefined {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }

        return undefined;
    }
}