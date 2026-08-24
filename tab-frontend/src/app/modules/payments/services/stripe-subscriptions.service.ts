import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PaymentMetadata {
    [key: string]: string | number | boolean | undefined;
}

export interface StripePublicConfig {
    provider: 'stripe';
    publishableKey: string;
}

export interface StripeCustomerRequest {
    email: string;
    name?: string;
    description?: string;
    metadata?: PaymentMetadata;
}

export interface StripeCustomerResponse {
    id: string;
    email?: string | null;
    name?: string | null;
}

export interface StripeSubscriptionRequest {
    customerId: string;
    priceId: string;
    planId?: string;
    billingCycle?: 'monthly' | 'yearly';
    paymentMethodId?: string;
    trialPeriodDays?: number;
    metadata?: PaymentMetadata;
}

export interface StripeSubscriptionResponse {
    id: string;
    status: string;
    customer: string;
    latest_invoice?: {
        payment_intent?: {
            id?: string;
            status?: string;
            client_secret?: string | null;
        } | string | null;
    } | null;
    pending_setup_intent?: {
        id?: string;
        status?: string;
        client_secret?: string | null;
    } | null;
}

export interface StripeCheckoutSessionRequest {
    priceId: string;
    planId?: string;
    billingCycle?: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    customerEmail?: string;
    quantity?: number;
    metadata?: PaymentMetadata;
}

export interface StripeCheckoutSessionResponse {
    id: string;
    url?: string | null;
    customer?: string | null;
}

export interface StripeBillingPortalRequest {
    customerId: string;
    returnUrl: string;
}

export interface StripeBillingPortalResponse {
    id: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class StripeSubscriptionsService {
    readonly publishableKey = 'pk_test_51T8yWGDMcSySjYCyqIuQtEPJlHmfdQbWVzXwcQPvaoHNDtYYEOHYsqvyM7K2L0koXSkmqWEEszUZ3tPAU3W5WjAB003eUvIKLu';
    private readonly baseUrl = `${environment.apiUrl}payments/stripe`;
    private readonly stripeClients = new Map<string, Promise<Stripe>>();

    constructor(private readonly http: HttpClient) { }

    async getStripeClient(publishableKey = this.publishableKey): Promise<Stripe> {
        const resolvedPublishableKey = publishableKey.trim();

        if (!resolvedPublishableKey) {
            throw new Error('Stripe is not configured for this environment.');
        }

        const existingClient = this.stripeClients.get(resolvedPublishableKey);
        if (existingClient) {
            return existingClient;
        }

        const clientPromise = this.loadStripeClient(resolvedPublishableKey).catch((error: unknown) => {
            this.stripeClients.delete(resolvedPublishableKey);
            throw error;
        });

        this.stripeClients.set(resolvedPublishableKey, clientPromise);
        return clientPromise;
    }

    getConfig(): Observable<StripePublicConfig> {
        return this.http.get<StripePublicConfig>(`${this.baseUrl}/config`, this.getHttpOptions());
    }

    createCustomer(payload: StripeCustomerRequest): Observable<StripeCustomerResponse> {
        return this.http.post<StripeCustomerResponse>(`${this.baseUrl}/customers`, payload, this.getHttpOptions());
    }

    createSubscription(payload: StripeSubscriptionRequest): Observable<StripeSubscriptionResponse> {
        return this.http.post<StripeSubscriptionResponse>(`${this.baseUrl}/subscriptions`, payload, this.getHttpOptions());
    }

    getSubscription(subscriptionId: string): Observable<StripeSubscriptionResponse> {
        return this.http.get<StripeSubscriptionResponse>(`${this.baseUrl}/subscriptions/${subscriptionId}`, this.getHttpOptions());
    }

    cancelSubscription(subscriptionId: string, immediately = false): Observable<StripeSubscriptionResponse> {
        return this.http.delete<StripeSubscriptionResponse>(
            `${this.baseUrl}/subscriptions/${subscriptionId}?immediately=${immediately}`,
            this.getHttpOptions(),
        );
    }

    createCheckoutSession(payload: StripeCheckoutSessionRequest): Observable<StripeCheckoutSessionResponse> {
        return this.http.post<StripeCheckoutSessionResponse>(`${this.baseUrl}/checkout-sessions`, payload, this.getHttpOptions());
    }

    createBillingPortalSession(payload: StripeBillingPortalRequest): Observable<StripeBillingPortalResponse> {
        return this.http.post<StripeBillingPortalResponse>(`${this.baseUrl}/billing-portal-sessions`, payload, this.getHttpOptions());
    }

    private getHttpOptions() {
        const userId = sessionStorage.getItem(environment.storage.userId);
        const token = userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) : null;

        const headers = token
            ? new HttpHeaders({
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8',
                Accept: 'application/json',
            })
            : new HttpHeaders({
                'Content-Type': 'application/json; charset=utf-8',
                Accept: 'application/json',
            });

        return {
            headers,
            withCredentials: false,
        };
    }

    private async loadStripeClient(publishableKey: string): Promise<Stripe> {
        try {
            const stripe = await loadStripe(publishableKey);

            if (!stripe) {
                throw new Error('Unable to initialize Stripe.');
            }

            return stripe;
        } catch (error) {
            throw new Error(this.normalizeStripeLoadError(error));
        }
    }

    private normalizeStripeLoadError(error: unknown): string {
        if (!(error instanceof Error)) {
            return 'Failed to load Stripe.js.';
        }

        const reason = error.message.trim();

        if (!reason || /^Failed to load Stripe\.js\.?$/i.test(reason)) {
            return 'Failed to load Stripe.js.';
        }

        return `Failed to load Stripe.js. ${reason}`;
    }
}