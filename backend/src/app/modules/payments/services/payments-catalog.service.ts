import { Injectable } from '@nestjs/common';
import { PaymentCatalogPlan, PaymentsCatalogResponse } from '../dto/payments.dto';

@Injectable()
export class PaymentsCatalogService {
    getCatalog(): PaymentsCatalogResponse {
        const stripePublishableKeyConfigured = this.hasConfiguredValue(process.env.STRIPE_PUBLISHABLE_KEY);
        const stripeSecretKeyConfigured = this.hasConfiguredValue(process.env.STRIPE_SECRET_KEY);
        const stripeConfigured = stripeSecretKeyConfigured;
        const goCardlessConfigured = this.hasConfiguredValue(process.env.GOCARDLESS_ACCESS_TOKEN);

        return {
            providers: {
                stripe: {
                    configured: stripeConfigured,
                    publishableKeyConfigured: stripePublishableKeyConfigured,
                },
                gocardless: {
                    configured: goCardlessConfigured,
                    environment: (process.env.GOCARDLESS_BASE_URL || 'https://api-sandbox.gocardless.com').includes('sandbox')
                        ? 'sandbox'
                        : 'live',
                },
            },
            plans: [
                this.createPlan(
                    'starter',
                    'Starter',
                    29,
                    290,
                    process.env.STRIPE_PRICE_STARTER_MONTHLY,
                    process.env.STRIPE_PRICE_STARTER_YEARLY,
                    stripeConfigured ? 'stripe' : (goCardlessConfigured ? 'gocardless' : undefined),
                ),
                this.createPlan(
                    'professional',
                    'Professional',
                    79,
                    790,
                    process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
                    process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
                    goCardlessConfigured ? 'gocardless' : (stripeConfigured ? 'stripe' : undefined),
                ),
                {
                    id: 'enterprise',
                    name: 'Enterprise',
                    custom: true,
                },
            ],
        };
    }

    getPlan(planId?: string): PaymentCatalogPlan | undefined {
        if (!planId) {
            return undefined;
        }

        return this.getCatalog().plans.find((plan) => plan.id === planId);
    }

    private createPlan(
        id: string,
        name: string,
        monthlyAmount: number,
        yearlyAmount: number,
        monthlyPriceId?: string,
        yearlyPriceId?: string,
        preferredProvider?: 'stripe' | 'gocardless',
    ): PaymentCatalogPlan {
        const resolvedMonthlyPriceId = this.resolveConfiguredValue(monthlyPriceId);
        const resolvedYearlyPriceId = this.resolveConfiguredValue(yearlyPriceId);

        return {
            id,
            name,
            preferredProvider,
            monthly: {
                amount: monthlyAmount,
                currency: 'EUR',
                stripePriceId: resolvedMonthlyPriceId,
                configured: true,
            },
            yearly: {
                amount: yearlyAmount,
                currency: 'EUR',
                stripePriceId: resolvedYearlyPriceId,
                configured: true,
            },
        };
    }

    private resolveConfiguredValue(value?: string): string | undefined {
        if (!value) {
            return undefined;
        }

        const trimmedValue = value.trim();
        if (!trimmedValue || trimmedValue.toLowerCase().includes('replace_with')) {
            return undefined;
        }

        return trimmedValue;
    }

    private hasConfiguredValue(value?: string): boolean {
        return !!this.resolveConfiguredValue(value);
    }
}