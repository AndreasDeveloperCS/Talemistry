export interface MetadataMap {
    [key: string]: string | number | boolean | undefined;
}

export type BillingCycle = 'monthly' | 'yearly';

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

export interface PaymentSubscriptionState {
    provider?: PaymentProvider;
    planId?: string;
    planName?: string;
    billingCycle?: BillingCycle;
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
    metadata?: MetadataMap;
    lastEvent?: PaymentEventRecord;
    updatedAt?: string;
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

export interface StripeCustomerPayload {
    email: string;
    name?: string;
    description?: string;
    metadata?: MetadataMap;
}

export interface StripeSubscriptionPayload {
    customerId: string;
    priceId: string;
    planId?: string;
    billingCycle?: BillingCycle;
    paymentMethodId?: string;
    trialPeriodDays?: number;
    metadata?: MetadataMap;
}

export interface StripeCheckoutSessionPayload {
    priceId: string;
    planId?: string;
    billingCycle?: BillingCycle;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    customerEmail?: string;
    quantity?: number;
    metadata?: MetadataMap;
}

export interface StripeBillingPortalPayload {
    customerId: string;
    returnUrl: string;
}

export interface GoCardlessCustomerPayload {
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
    metadata?: MetadataMap;
}

export interface GoCardlessRedirectFlowPayload {
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

export interface GoCardlessCompleteRedirectFlowPayload {
    redirectFlowId: string;
    sessionToken: string;
}

export interface GoCardlessSubscriptionPayload {
    mandateId: string;
    amount: number;
    currency: string;
    planId?: string;
    billingCycle?: BillingCycle;
    name: string;
    interval: number;
    intervalUnit: 'weekly' | 'monthly' | 'yearly';
    paymentDayOfMonth?: number;
    month?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
    startDate?: string;
    count?: number;
    metadata?: MetadataMap;
}

export interface GoCardlessCancelSubscriptionPayload {
    metadata?: MetadataMap;
}