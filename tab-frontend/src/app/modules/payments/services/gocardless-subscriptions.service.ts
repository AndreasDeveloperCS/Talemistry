import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMetadata } from './stripe-subscriptions.service';

export interface GoCardlessPublicConfig {
    provider: 'gocardless';
    environment: 'sandbox' | 'live';
    redirectFlowBaseUrl: string;
}

export interface GoCardlessCustomerRequest {
    email: string;
    givenName: string;
    familyName: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    countryCode?: string;
    region?: string;
    metadata?: PaymentMetadata;
}

export interface GoCardlessCustomerResponse {
    customers: {
        id: string;
        email: string;
        given_name: string;
        family_name: string;
    };
}

export interface GoCardlessRedirectFlowRequest {
    description: string;
    sessionToken: string;
    successRedirectUrl: string;
    prefilledCustomer?: {
        givenName?: string;
        familyName?: string;
        email?: string;
        companyName?: string;
    };
}

export interface GoCardlessRedirectFlowResponse {
    redirect_flows: {
        id: string;
        redirect_url: string;
        session_token: string;
        links?: {
            mandate?: string;
            customer?: string;
            creditor?: string;
        };
    };
}

export interface GoCardlessCompleteRedirectFlowRequest {
    redirectFlowId: string;
    sessionToken: string;
}

export interface GoCardlessSubscriptionRequest {
    mandateId: string;
    amount: number;
    currency: string;
    planId?: string;
    billingCycle?: 'monthly' | 'yearly';
    name: string;
    interval: number;
    intervalUnit: 'weekly' | 'monthly' | 'yearly';
    paymentDayOfMonth?: number;
    month?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
    startDate?: string;
    count?: number;
    metadata?: PaymentMetadata;
}

export interface GoCardlessSubscriptionResponse {
    subscriptions: {
        id: string;
        status: string;
        amount: number;
        currency: string;
        links?: {
            mandate?: string;
        };
    };
}

export interface GoCardlessCancelSubscriptionRequest {
    metadata?: PaymentMetadata;
}

@Injectable({
    providedIn: 'root'
})
export class GoCardlessSubscriptionsService {
    private readonly baseUrl = `${environment.apiUrl}payments/gocardless`;

    constructor(private readonly http: HttpClient) { }

    getConfig(): Observable<GoCardlessPublicConfig> {
        return this.http.get<GoCardlessPublicConfig>(`${this.baseUrl}/config`, this.getHttpOptions());
    }

    createCustomer(payload: GoCardlessCustomerRequest): Observable<GoCardlessCustomerResponse> {
        return this.http.post<GoCardlessCustomerResponse>(`${this.baseUrl}/customers`, payload, this.getHttpOptions());
    }

    createRedirectFlow(payload: GoCardlessRedirectFlowRequest): Observable<GoCardlessRedirectFlowResponse> {
        return this.http.post<GoCardlessRedirectFlowResponse>(`${this.baseUrl}/redirect-flows`, payload, this.getHttpOptions());
    }

    completeRedirectFlow(payload: GoCardlessCompleteRedirectFlowRequest): Observable<GoCardlessRedirectFlowResponse> {
        return this.http.post<GoCardlessRedirectFlowResponse>(`${this.baseUrl}/redirect-flows/complete`, payload, this.getHttpOptions());
    }

    createSubscription(payload: GoCardlessSubscriptionRequest): Observable<GoCardlessSubscriptionResponse> {
        return this.http.post<GoCardlessSubscriptionResponse>(`${this.baseUrl}/subscriptions`, payload, this.getHttpOptions());
    }

    getSubscription(subscriptionId: string): Observable<GoCardlessSubscriptionResponse> {
        return this.http.get<GoCardlessSubscriptionResponse>(`${this.baseUrl}/subscriptions/${subscriptionId}`, this.getHttpOptions());
    }

    cancelSubscription(
        subscriptionId: string,
        payload: GoCardlessCancelSubscriptionRequest = {},
    ): Observable<GoCardlessSubscriptionResponse> {
        return this.http.post<GoCardlessSubscriptionResponse>(
            `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
            payload,
            this.getHttpOptions(),
        );
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