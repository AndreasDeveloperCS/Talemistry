import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import {
    MetadataMap,
    StripeBillingPortalPayload,
    StripeCheckoutSessionPayload,
    StripeCustomerPayload,
    StripeSubscriptionPayload,
} from '../dto/payments.dto';
import Stripe from 'stripe';
import { PaymentsStateService } from './payments-state.service';

@Injectable()
export class StripePaymentsService {
    private readonly logger = new Logger(StripePaymentsService.name);
    private readonly apiBaseUrl = 'https://api.stripe.com/v1';
    private readonly defaultPublishableKey = 'pk_test_51T8yWGDMcSySjYCyqIuQtEPJlHmfdQbWVzXwcQPvaoHNDtYYEOHYsqvyM7K2L0koXSkmqWEEszUZ3tPAU3W5WjAB003eUvIKLu';

    private readonly stripe = new Stripe(
        this.getSecretKey(),
        {
            apiVersion: '2026-07-29.dahlia',
        },
    );

    constructor(private paymentsStateService: PaymentsStateService) { }

    getPublicConfig() {
        return {
            provider: 'stripe',
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || this.defaultPublishableKey,
        };
    }

    async createCustomer(payload: StripeCustomerPayload) {
        const params = new URLSearchParams();
        params.append('email', payload.email);

        if (payload.name) {
            params.append('name', payload.name);
        }

        if (payload.description) {
            params.append('description', payload.description);
        }

        this.appendMetadata(params, payload.metadata);

        const { data } = await this.post('customers', params, 'create Stripe customer');
        return data;
    }

    async attachPaymentMethod(customerId: string, paymentMethodId: string) {
        const attachParams = new URLSearchParams();
        attachParams.append('customer', customerId);

        await this.post(
            `payment_methods/${paymentMethodId}/attach`,
            attachParams,
            'attach Stripe payment method',
        );

        const customerParams = new URLSearchParams();
        customerParams.append('invoice_settings[default_payment_method]', paymentMethodId);

        await this.post(
            `customers/${customerId}`,
            customerParams,
            'update Stripe customer default payment method',
        );

        return {
            customerId,
            paymentMethodId,
        };
    }

    async createSubscription(payload: StripeSubscriptionPayload) {
        const params = new URLSearchParams();
        params.append('customer', payload.customerId);
        params.append('items[0][price]', payload.priceId);
        params.append('payment_behavior', 'default_incomplete');
        params.append('payment_settings[save_default_payment_method]', 'on_subscription');
        params.append('expand[]', 'latest_invoice.payment_intent');
        params.append('expand[]', 'pending_setup_intent');

        if (payload.paymentMethodId) {
            params.append('default_payment_method', payload.paymentMethodId);
        }

        if (typeof payload.trialPeriodDays === 'number') {
            params.append('trial_period_days', String(payload.trialPeriodDays));
        }

        this.appendMetadata(params, payload.metadata);

        const { data } = await this.post('subscriptions', params, 'create Stripe subscription');
        return data;
    }

    async getSubscription(subscriptionId: string) {
        const { data } = await this.get(`subscriptions/${subscriptionId}`, 'retrieve Stripe subscription');
        return data;
    }

    async cancelSubscription(subscriptionId: string, immediately = false) {
        if (immediately) {
            const { data } = await this.delete(`subscriptions/${subscriptionId}`, 'cancel Stripe subscription immediately');
            return data;
        }

        const params = new URLSearchParams();
        params.append('cancel_at_period_end', 'true');

        const { data } = await this.post(
            `subscriptions/${subscriptionId}`,
            params,
            'schedule Stripe subscription cancellation',
        );

        return data;
    }

    async createCheckoutSession(payload: StripeCheckoutSessionPayload) {
        const params = new URLSearchParams();
        params.append('mode', 'subscription');
        params.append('line_items[0][price]', payload.priceId);
        params.append('line_items[0][quantity]', String(payload.quantity || 1));
        params.append('success_url', payload.successUrl);
        params.append('cancel_url', payload.cancelUrl);
        params.append('payment_method_types[0]', 'card');

        if (payload.customerId) {
            params.append('customer', payload.customerId);
        } else if (payload.customerEmail) {
            params.append('customer_email', payload.customerEmail);
        }

        this.appendMetadata(params, payload.metadata);
        this.appendMetadata(params, payload.metadata, 'subscription_data[metadata]');

        const { data } = await this.post('checkout/sessions', params, 'create Stripe checkout session');
        return data;
    }

    async createBillingPortalSession(payload: StripeBillingPortalPayload) {
        const params = new URLSearchParams();
        params.append('customer', payload.customerId);
        params.append('return_url', payload.returnUrl);

        const { data } = await this.post('billing_portal/sessions', params, 'create Stripe billing portal session');
        return data;
    }

    // async handleWebhook(rawBody: string | undefined, signature?: string) {
    //     if (!rawBody) {
    //         throw new BadRequestException('Stripe webhook requires the raw request body.');
    //     }

    //     if (!signature) {
    //         throw new UnauthorizedException('Missing Stripe webhook signature.');
    //     }

    //     const webhookSecret = this.getWebhookSecret();

    //     if (!this.isStripeSignatureValid(rawBody, signature, webhookSecret)) {
    //         throw new UnauthorizedException('Invalid Stripe webhook signature.');
    //     }

    //     let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };

    //     try {
    //         event = JSON.parse(rawBody);
    //     } catch {
    //         throw new BadRequestException('Invalid Stripe webhook payload.');
    //     }

    //     const summary = this.summarizeStripeEvent(event);
    //     this.logger.log(`Stripe webhook received: ${summary}`);

    //     return {
    //         received: true,
    //         provider: 'stripe',
    //         eventId: event.id || 'unknown',
    //         eventType: event.type || 'unknown',
    //         summary,
    //         event,
    //     };
    // }

    async handleWebhook(rawBody?: string, signature?: string) {
        if (!rawBody) {
            throw new BadRequestException(
                'Stripe webhook requires the raw request body.',
            );
        }

        if (!signature) {
            throw new UnauthorizedException(
                'Missing Stripe webhook signature.',
            );
        }

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.getWebhookSecret(),
            );
        } catch (error) {
            this.logger.error('Invalid Stripe webhook signature.', error);

            throw new UnauthorizedException(
                'Invalid Stripe webhook signature.',
            );
        }

        await this.paymentsStateService.persistStripeWebhook(event);

        await this.processWebhook(event);

        return {
            received: true,
            provider: 'stripe',
            eventId: event.id,
            eventType: event.type,
        };
    }

    private async processWebhook(event: Stripe.Event) {
        switch (event.type) {

            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event);
                break;

            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event);
                break;

            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event);
                break;

            case 'invoice.paid':
                await this.handleInvoicePaid(event);
                break;

            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event);
                break;

            default:
                this.logger.debug(
                    `Ignoring Stripe event ${event.type}`,
                );
        }
    }

    private async handleCheckoutCompleted(
        event: Stripe.Event,
    ) {
        const session = event.data.object as Stripe.Checkout.Session;

        this.logger.log(
            `Checkout completed: ${session.id}`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // send welcome email
        // create company if needed
    }

    private async handleSubscriptionCreated(
        event: Stripe.Event,
    ) {
        const subscription =
            event.data.object as Stripe.Subscription;

        this.logger.log(
            `Subscription created: ${subscription.id}`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // initialize quota
        // enable premium features
    }

    private async handleSubscriptionUpdated(
        event: Stripe.Event,
    ) {
        const subscription =
            event.data.object as Stripe.Subscription;

        this.logger.log(
            `Subscription updated: ${subscription.id} (${subscription.status})`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // detect plan change
        // update limits
    }

    private async handleSubscriptionDeleted(
        event: Stripe.Event,
    ) {
        const subscription =
            event.data.object as Stripe.Subscription;

        this.logger.log(
            `Subscription cancelled: ${subscription.id}`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // revoke premium access
    }

    private async handleInvoicePaid(
        event: Stripe.Event,
    ) {
        const invoice =
            event.data.object as Stripe.Invoice;

        this.logger.log(
            `Invoice paid: ${invoice.id}`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // record payment history
    }

    private async handleInvoicePaymentFailed(
        event: Stripe.Event,
    ) {
        const invoice =
            event.data.object as Stripe.Invoice;

        this.logger.warn(
            `Invoice payment failed: ${invoice.id}`,
        );

        await this.paymentsStateService.persistStripeWebhook(event);

        // Future:
        // notify user
    }

    private appendMetadata(params: URLSearchParams, metadata?: MetadataMap, prefix = 'metadata') {
        if (!metadata) {
            return;
        }

        Object.entries(metadata).forEach(([key, value]) => {
            if (typeof value !== 'undefined') {
                params.append(`${prefix}[${key}]`, String(value));
            }
        });
    }

    private getSecretKey() {
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey) {
            throw new InternalServerErrorException('Stripe secret key is not configured. Set STRIPE_SECRET_KEY on the backend.');
        }

        return secretKey;
    }

    private getWebhookSecret() {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new InternalServerErrorException('Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET on the backend.');
        }

        return webhookSecret;
    }

    private async get(path: string, action: string) {
        try {
            return await axios.get(`${this.apiBaseUrl}/${path}`, {
                headers: {
                    Authorization: `Bearer ${this.getSecretKey()}`,
                },
            });
        } catch (error) {
            this.handleStripeError(error, action);
        }
    }

    private async post(path: string, body: URLSearchParams, action: string) {
        try {
            return await axios.post(`${this.apiBaseUrl}/${path}`, body.toString(), {
                headers: {
                    Authorization: `Bearer ${this.getSecretKey()}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
        } catch (error) {
            this.handleStripeError(error, action);
        }
    }

    private async delete(path: string, action: string) {
        try {
            return await axios.delete(`${this.apiBaseUrl}/${path}`, {
                headers: {
                    Authorization: `Bearer ${this.getSecretKey()}`,
                },
            });
        } catch (error) {
            this.handleStripeError(error, action);
        }
    }

    private handleStripeError(error: unknown, action: string): never {
        const axiosError = error as AxiosError<{ error?: { message?: string } }>;
        const providerMessage = axiosError.response?.data?.error?.message || axiosError.message;

        this.logger.error(`Failed to ${action}`, providerMessage);
        throw new BadGatewayException(`Stripe request failed: ${providerMessage}`);
    }
}