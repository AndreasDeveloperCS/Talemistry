import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import {
    GoCardlessCancelSubscriptionPayload,
    GoCardlessCompleteRedirectFlowPayload,
    GoCardlessCustomerPayload,
    GoCardlessRedirectFlowPayload,
    GoCardlessSubscriptionPayload,
    MetadataMap,
    PaymentBillingContact,
} from '../dto/payments.dto';
import { UtilitiesService } from '../../core/services/utilities.service';
import { PaymentsStateService } from '../services/payments-state.service';
import { GoCardlessPaymentsService } from '../services/gocardless-payments.service';

@Controller('payments/gocardless')
export class GoCardlessPaymentsController {
    constructor(
        private readonly goCardlessPaymentsService: GoCardlessPaymentsService,
        private readonly paymentsStateService: PaymentsStateService,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    @Get('config')
    getPublicConfig() {
        return this.goCardlessPaymentsService.getPublicConfig();
    }

    @Post('customers')
    async createCustomer(@Body() payload: GoCardlessCustomerPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request, payload.metadata);
        const response = await this.goCardlessPaymentsService.createCustomer({ ...payload, metadata });

        await this.paymentsStateService.persistState({
            provider: 'gocardless',
            customerId: response.customers?.id,
            status: 'customer_created',
            billingContact: this.mergeBillingContact(
                {
                    email: response.customers?.email || payload.email,
                    givenName: response.customers?.given_name || payload.givenName,
                    familyName: response.customers?.family_name || payload.familyName,
                    companyName: payload.companyName,
                    fullName: [response.customers?.given_name || payload.givenName, response.customers?.family_name || payload.familyName]
                        .filter((value) => !!String(value || '').trim())
                        .join(' ') || undefined,
                },
                this.getBillingContactFromUser(request),
            ),
            metadata,
        });

        return response;
    }

    @Post('redirect-flows')
    async createRedirectFlow(@Body() payload: GoCardlessRedirectFlowPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request);
        const response = await this.goCardlessPaymentsService.createRedirectFlow(payload);

        await this.paymentsStateService.persistState({
            provider: 'gocardless',
            redirectFlowId: response.redirect_flows?.id,
            mandateId: response.redirect_flows?.links?.mandate,
            customerId: response.redirect_flows?.links?.customer,
            status: 'redirect_flow_created',
            billingContact: this.mergeBillingContact(
                {
                    email: payload.prefilledCustomer?.email,
                    givenName: payload.prefilledCustomer?.givenName,
                    familyName: payload.prefilledCustomer?.familyName,
                    companyName: payload.prefilledCustomer?.companyName,
                    fullName: [payload.prefilledCustomer?.givenName, payload.prefilledCustomer?.familyName]
                        .filter((value) => !!String(value || '').trim())
                        .join(' ') || undefined,
                },
                this.getBillingContactFromUser(request),
            ),
            metadata,
        });

        return response;
    }

    @Post('redirect-flows/complete')
    async completeRedirectFlow(@Body() payload: GoCardlessCompleteRedirectFlowPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request);
        const response = await this.goCardlessPaymentsService.completeRedirectFlow(payload);

        await this.paymentsStateService.persistState({
            provider: 'gocardless',
            redirectFlowId: response.redirect_flows?.id || payload.redirectFlowId,
            mandateId: response.redirect_flows?.links?.mandate,
            customerId: response.redirect_flows?.links?.customer,
            status: 'mandate_ready',
            billingContact: this.getBillingContactFromUser(request),
            metadata,
        });

        return response;
    }

    @Post('subscriptions')
    async createSubscription(@Body() payload: GoCardlessSubscriptionPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request, payload.metadata);
        const response = await this.goCardlessPaymentsService.createSubscription({ ...payload, metadata });

        await this.paymentsStateService.persistState({
            provider: 'gocardless',
            subscriptionId: response.subscriptions?.id,
            mandateId: payload.mandateId,
            amount: payload.amount,
            currency: payload.currency,
            status: response.subscriptions?.status,
            billingContact: this.getBillingContactFromUser(request),
            metadata,
        });

        return response;
    }

    @Get('subscriptions/:subscriptionId')
    getSubscription(@Param('subscriptionId') subscriptionId: string) {
        return this.goCardlessPaymentsService.getSubscription(subscriptionId);
    }

    @Post('subscriptions/:subscriptionId/cancel')
    async cancelSubscription(
        @Param('subscriptionId') subscriptionId: string,
        @Body() payload?: GoCardlessCancelSubscriptionPayload,
    ) {
        const response = await this.goCardlessPaymentsService.cancelSubscription(subscriptionId, payload);

        await this.paymentsStateService.persistState({
            provider: 'gocardless',
            subscriptionId,
            status: 'cancel_requested',
            metadata: payload?.metadata,
        });

        return response;
    }

    @Post('webhooks')
    async handleWebhook(
        @Req() request: Request,
        @Headers('webhook-signature') signature?: string,
    ) {
        const result = await this.goCardlessPaymentsService.handleWebhook(request.rawBody, signature);
        await this.paymentsStateService.persistGoCardlessWebhook(result.events || []);

        return result;
    }

    private async enrichMetadata(request: Request, metadata?: MetadataMap) {
        const user = this.utilitiesService.getUser(request);
        if (!user?._id) {
            return metadata;
        }

        const userId = String(user._id);
        const companyId = await this.paymentsStateService.getCurrentCompanyId(userId);

        return this.paymentsStateService.createMetadata(metadata, userId, companyId);
    }

    private getBillingContactFromUser(request: Request): PaymentBillingContact | undefined {
        const user = this.utilitiesService.getUser(request);

        return this.mergeBillingContact(undefined, {
            email: user?.email,
            givenName: user?.firstname,
            familyName: user?.lastname,
            fullName: [user?.firstname, user?.lastname].filter((value) => !!String(value || '').trim()).join(' ') || undefined,
            phone: user?.phone,
        });
    }

    private mergeBillingContact(
        primary?: PaymentBillingContact,
        fallback?: PaymentBillingContact,
    ): PaymentBillingContact | undefined {
        const merged: PaymentBillingContact = {
            ...(fallback || {}),
            ...(primary || {}),
        };

        return Object.values(merged).some((value) => typeof value === 'string' && value.trim())
            ? merged
            : undefined;
    }
}