import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMetadata } from './stripe-subscriptions.service';

export type PaymentBillingCycle = 'monthly' | 'yearly';

export type PaymentProvider = 'stripe' | 'gocardless';

export interface PaymentEventRecord {
    id?: string;
    type?: string;
    action?: string;
    resourceType?: string;
    summary?: string;
    processedAt: string;
}

export interface PaymentBillingContact {
    email?: string;
    fullName?: string;
    givenName?: string;
    familyName?: string;
    companyName?: string;
    phone?: string;
}

export interface PaymentCatalogBillingOption {
    amount?: number;
    currency?: string;
    stripePriceId?: string;
    configured?: boolean;
}

export interface PaymentCatalogPlan {
    id: string;
    name: string;
    preferredProvider?: PaymentProvider;
    monthly?: PaymentCatalogBillingOption;
    yearly?: PaymentCatalogBillingOption;
    custom?: boolean;
}

export interface PaymentsCatalogResponse {
    providers: {
        stripe: {
            configured: boolean;
            publishableKeyConfigured: boolean;
        };
        gocardless: {
            configured: boolean;
            environment: 'sandbox' | 'live';
        };
    };
    plans: PaymentCatalogPlan[];
}

export interface PaymentSubscriptionState {
    provider?: PaymentProvider;
    planId?: string;
    planName?: string;
    billingCycle?: PaymentBillingCycle;
    status?: string;
    customerId?: string;
    subscriptionId?: string;
    checkoutSessionId?: string;
    mandateId?: string;
    redirectFlowId?: string;
    amount?: number;
    currency?: string;
    companyId?: string;
    billingContact?: PaymentBillingContact;
    metadata?: PaymentMetadata;
    lastEvent?: PaymentEventRecord;
    updatedAt?: string;
}

export interface PaymentSubscriptionStateResponse {
    subscription: PaymentSubscriptionState | null;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentsStateService {
    private readonly baseUrl = `${environment.apiUrl}payments`;

    constructor(private readonly http: HttpClient) { }

    getCatalog(): Observable<PaymentsCatalogResponse> {
        return this.http.get<PaymentsCatalogResponse>(`${this.baseUrl}/catalog`, this.getHttpOptions());
    }

    getSubscriptionState(): Observable<PaymentSubscriptionStateResponse> {
        return this.http.get<PaymentSubscriptionStateResponse>(`${this.baseUrl}/subscription-state`, this.getHttpOptions());
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
}