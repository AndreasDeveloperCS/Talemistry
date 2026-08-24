import { Body, Controller, Delete, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import {
    MetadataMap,
    PaymentBillingContact,
    StripeBillingPortalPayload,
    StripeCheckoutSessionPayload,
    StripeCustomerPayload,
    StripeSubscriptionPayload,
} from '../dto/payments.dto';
import { UtilitiesService } from '../../core/services/utilities.service';
import { PaymentsStateService } from '../services/payments-state.service';
import { StripePaymentsService } from '../services/stripe-payments.service';

@Controller('payments/stripe')
export class StripePaymentsController {
    constructor(
        private readonly stripePaymentsService: StripePaymentsService,
        private readonly paymentsStateService: PaymentsStateService,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    @Get('config')
    getPublicConfig() {
        return this.stripePaymentsService.getPublicConfig();
    }

    @Post('customers')
    async createCustomer(@Body() payload: StripeCustomerPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request, payload.metadata);
        const response = await this.stripePaymentsService.createCustomer({ ...payload, metadata });

        await this.paymentsStateService.persistState({
            provider: 'stripe',
            customerId: response.id,
            status: 'customer_created',
            billingContact: this.mergeBillingContact(
                {
                    email: response.email || payload.email,
                    fullName: response.name || payload.name,
                },
                this.getBillingContactFromUser(request),
            ),
            metadata,
        });

        return response;
    }

    @Post('subscriptions')
    async createSubscription(@Body() payload: StripeSubscriptionPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request, payload.metadata);

        if (payload.paymentMethodId) {
            await this.stripePaymentsService.attachPaymentMethod(payload.customerId, payload.paymentMethodId);
        }

        const response = await this.stripePaymentsService.createSubscription({ ...payload, metadata });

        await this.paymentsStateService.persistState({
            provider: 'stripe',
            customerId: payload.customerId,
            subscriptionId: response.id,
            status: response.status,
            billingContact: this.getBillingContactFromUser(request),
            metadata,
        });

        return response;
    }

    @Get('subscriptions/:subscriptionId')
    getSubscription(@Param('subscriptionId') subscriptionId: string) {
        return this.stripePaymentsService.getSubscription(subscriptionId);
    }

    @Delete('subscriptions/:subscriptionId')
    cancelSubscription(
        @Param('subscriptionId') subscriptionId: string,
        @Query('immediately') immediately?: string,
    ) {
        return this.stripePaymentsService.cancelSubscription(subscriptionId, immediately === 'true');
    }

    @Post('checkout-sessions')
    async createCheckoutSession(@Body() payload: StripeCheckoutSessionPayload, @Req() request: Request) {
        const metadata = await this.enrichMetadata(request, payload.metadata);
        const response = await this.stripePaymentsService.createCheckoutSession({ ...payload, metadata });

        await this.paymentsStateService.persistState({
            provider: 'stripe',
            customerId: typeof response.customer === 'string' ? response.customer : payload.customerId,
            checkoutSessionId: response.id,
            status: 'checkout_created',
            billingContact: this.mergeBillingContact(
                {
                    email: payload.customerEmail,
                },
                this.getBillingContactFromUser(request),
            ),
            metadata,
        });

        return response;
    }

    @Post('billing-portal-sessions')
    createBillingPortalSession(@Body() payload: StripeBillingPortalPayload) {
        return this.stripePaymentsService.createBillingPortalSession(payload);
    }

    // @Post('webhooks')
    // async handleWebhook(
    //     @Req() request: Request,
    //     @Headers('stripe-signature') signature?: string,
    // ) {
    //     const result = await this.stripePaymentsService.handleWebhook(request.rawBody, signature);
    //     await this.paymentsStateService.persistStripeWebhook(result.event);

    //     return {
    //         received: result.received,
    //         provider: result.provider,
    //         eventId: result.eventId,
    //         eventType: result.eventType,
    //         summary: result.summary,
    //     };
    // }
    @Post('webhooks')
    async handleWebhook(
        @Req() request: Request,
        @Headers('stripe-signature') signature?: string,
    ) {
        return this.stripePaymentsService.handleWebhook(
            request.rawBody,
            signature,
        );
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