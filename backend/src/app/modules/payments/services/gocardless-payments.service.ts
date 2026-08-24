import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
    GoCardlessCancelSubscriptionPayload,
    GoCardlessCompleteRedirectFlowPayload,
    GoCardlessCustomerPayload,
    GoCardlessRedirectFlowPayload,
    GoCardlessSubscriptionPayload,
} from '../dto/payments.dto';

@Injectable()
export class GoCardlessPaymentsService {
    private readonly logger = new Logger(GoCardlessPaymentsService.name);
    private readonly apiBaseUrl = process.env.GOCARDLESS_BASE_URL || 'https://api-sandbox.gocardless.com';
    private readonly apiVersion = process.env.GOCARDLESS_VERSION || '2015-07-06';

    getPublicConfig() {
        return {
            provider: 'gocardless',
            environment: this.apiBaseUrl.includes('sandbox') ? 'sandbox' : 'live',
            redirectFlowBaseUrl: this.apiBaseUrl,
        };
    }

    async createCustomer(payload: GoCardlessCustomerPayload) {
        const { data } = await this.post(
            'customers',
            {
                customers: {
                    email: payload.email,
                    given_name: payload.givenName,
                    family_name: payload.familyName,
                    company_name: payload.companyName,
                    address_line1: payload.addressLine1,
                    address_line2: payload.addressLine2,
                    city: payload.city,
                    postal_code: payload.postalCode,
                    country_code: payload.countryCode,
                    region: payload.region,
                    metadata: payload.metadata,
                },
            },
            'create GoCardless customer',
        );

        return data;
    }

    async createRedirectFlow(payload: GoCardlessRedirectFlowPayload) {
        const { data } = await this.post(
            'redirect_flows',
            {
                redirect_flows: {
                    description: payload.description,
                    session_token: payload.sessionToken,
                    success_redirect_url: payload.successRedirectUrl,
                    prefilled_customer: {
                        given_name: payload.prefilledCustomer?.givenName,
                        family_name: payload.prefilledCustomer?.familyName,
                        email: payload.prefilledCustomer?.email,
                        company_name: payload.prefilledCustomer?.companyName,
                    },
                },
            },
            'create GoCardless redirect flow',
        );

        return data;
    }

    async completeRedirectFlow(payload: GoCardlessCompleteRedirectFlowPayload) {
        const { data } = await this.post(
            `redirect_flows/${payload.redirectFlowId}/actions/complete`,
            {
                data: {
                    session_token: payload.sessionToken,
                },
            },
            'complete GoCardless redirect flow',
        );

        return data;
    }

    async createSubscription(payload: GoCardlessSubscriptionPayload) {
        const { data } = await this.post(
            'subscriptions',
            {
                subscriptions: {
                    amount: payload.amount,
                    currency: payload.currency,
                    name: payload.name,
                    interval: payload.interval,
                    interval_unit: payload.intervalUnit,
                    day_of_month: payload.paymentDayOfMonth,
                    month: payload.month,
                    start_date: payload.startDate,
                    count: payload.count,
                    metadata: payload.metadata,
                    links: {
                        mandate: payload.mandateId,
                    },
                },
            },
            'create GoCardless subscription',
        );

        return data;
    }

    async getSubscription(subscriptionId: string) {
        const { data } = await this.get(`subscriptions/${subscriptionId}`, 'retrieve GoCardless subscription');
        return data;
    }

    async cancelSubscription(subscriptionId: string, payload: GoCardlessCancelSubscriptionPayload = {}) {
        const { data } = await this.post(
            `subscriptions/${subscriptionId}/actions/cancel`,
            {
                data: {
                    metadata: payload.metadata,
                },
            },
            'cancel GoCardless subscription',
        );

        return data;
    }

    async handleWebhook(rawBody: string | undefined, signature?: string) {
        if (!rawBody) {
            throw new BadRequestException('GoCardless webhook requires the raw request body.');
        }

        if (!signature) {
            throw new UnauthorizedException('Missing GoCardless webhook signature.');
        }

        const webhookSecret = this.getWebhookSecret();
        const expectedSignature = createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex');

        if (!this.constantTimeCompare(signature, expectedSignature)) {
            throw new UnauthorizedException('Invalid GoCardless webhook signature.');
        }

        let payload: {
            events?: Array<{
                id?: string;
                action?: string;
                resource_type?: string;
                links?: Record<string, string>;
            }>;
        };

        try {
            payload = JSON.parse(rawBody);
        } catch {
            throw new BadRequestException('Invalid GoCardless webhook payload.');
        }

        const events = (payload.events || []).map((event) => ({
            id: event.id || 'unknown',
            action: event.action || 'unknown',
            resourceType: event.resource_type || 'unknown',
            links: event.links || {},
            details: (event as any).details,
            metadata: (event as any).metadata,
            resource_type: event.resource_type || 'unknown',
        }));

        this.logger.log(`GoCardless webhook received with ${events.length} event(s)`);

        return {
            received: true,
            provider: 'gocardless',
            eventsProcessed: events.length,
            events,
        };
    }

    private getAccessToken() {
        const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;

        if (!accessToken) {
            throw new InternalServerErrorException('GoCardless access token is not configured. Set GOCARDLESS_ACCESS_TOKEN on the backend.');
        }

        return accessToken;
    }

    private getWebhookSecret() {
        const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new InternalServerErrorException('GoCardless webhook secret is not configured. Set GOCARDLESS_WEBHOOK_SECRET on the backend.');
        }

        return webhookSecret;
    }

    private getHeaders(idempotencyKey?: string) {
        return {
            Authorization: `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json',
            'GoCardless-Version': this.apiVersion,
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        };
    }

    private async get(path: string, action: string) {
        try {
            return await axios.get(`${this.apiBaseUrl}/${path}`, {
                headers: this.getHeaders(),
            });
        } catch (error) {
            this.handleGoCardlessError(error, action);
        }
    }

    private async post(path: string, payload: unknown, action: string) {
        try {
            return await axios.post(`${this.apiBaseUrl}/${path}`, payload, {
                headers: this.getHeaders(randomUUID()),
            });
        } catch (error) {
            this.handleGoCardlessError(error, action);
        }
    }

    private handleGoCardlessError(error: unknown, action: string): never {
        const axiosError = error as AxiosError<{ error?: { message?: string }; error_summary?: string }>;
        const providerMessage = axiosError.response?.data?.error_summary
            || axiosError.response?.data?.error?.message
            || axiosError.message;

        this.logger.error(`Failed to ${action}`, providerMessage);
        throw new BadGatewayException(`GoCardless request failed: ${providerMessage}`);
    }

    private constantTimeCompare(left: string, right: string) {
        const leftBuffer = Buffer.from(left, 'utf8');
        const rightBuffer = Buffer.from(right, 'utf8');

        if (leftBuffer.length !== rightBuffer.length) {
            return false;
        }

        return timingSafeEqual(leftBuffer, rightBuffer);
    }
}