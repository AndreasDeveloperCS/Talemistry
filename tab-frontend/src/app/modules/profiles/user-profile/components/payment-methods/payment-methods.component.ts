import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import {
    Stripe,
    StripeCardCvcElement,
    StripeCardExpiryElement,
    StripeCardNumberElement,
    StripeElements,
} from '@stripe/stripe-js';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../authentication/services/auth.service';
import {
    GoCardlessPublicConfig,
    GoCardlessSubscriptionsService,
} from '../../../../payments/services/gocardless-subscriptions.service';
import {
    PaymentProvider,
    PaymentsCatalogResponse,
    PaymentSubscriptionState,
    PaymentSubscriptionStateResponse,
    PaymentsStateService,
} from '../../../../payments/services/payments-state.service';
import {
    StripeBillingPortalResponse,
    StripePublicConfig,
    StripeSubscriptionsService,
} from '../../../../payments/services/stripe-subscriptions.service';

export interface SavedPaymentMethod {
    id: string;
    provider: PaymentProvider;
    label: string;
    last4?: string;
    brand?: string;
    isDefault: boolean;
    expiryMonth?: number;
    expiryYear?: number;
    bankName?: string;
    accountNumberEnding?: string;
    mandateId?: string;
}

@Component({
    selector: 'app-payment-methods',
    templateUrl: './payment-methods.component.html',
    styleUrls: ['./payment-methods.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodsComponent implements OnInit, OnDestroy {
    @ViewChild('newCardNumberHost')
    set cardNumberHostRef(ref: ElementRef<HTMLDivElement> | undefined) {
        this.cardNumberHost = ref;
        void this.tryMountStripeElements();
    }

    @ViewChild('newCardExpiryHost')
    set cardExpiryHostRef(ref: ElementRef<HTMLDivElement> | undefined) {
        this.cardExpiryHost = ref;
        void this.tryMountStripeElements();
    }

    @ViewChild('newCardCvcHost')
    set cardCvcHostRef(ref: ElementRef<HTMLDivElement> | undefined) {
        this.cardCvcHost = ref;
        void this.tryMountStripeElements();
    }

    paymentMethods: SavedPaymentMethod[] = [];
    currentSubscription: PaymentSubscriptionState | null = null;
    stripeConfig?: StripePublicConfig;
    goCardlessConfig?: GoCardlessPublicConfig;
    providerAvailability: { stripe: boolean; gocardless: boolean } = { stripe: false, gocardless: false };

    showAddForm = false;
    addProvider: PaymentProvider = 'stripe';
    addCardholderName = '';
    addGcCardForm = {
        cardholderName: '',
        cardNumber: '',
        expiration: '',
        cvc: '',
    };
    stripeCardReady = false;
    stripeCardError = '';

    busy = false;
    statusMessage = '';
    statusTone: 'info' | 'success' | 'error' = 'info';

    private readonly destroy$ = new Subject<void>();
    private stripe?: Stripe;
    private stripeElements?: StripeElements;
    private stripeCardNumberElement?: StripeCardNumberElement;
    private stripeCardExpiryElement?: StripeCardExpiryElement;
    private stripeCardCvcElement?: StripeCardCvcElement;
    private cardNumberHost?: ElementRef<HTMLDivElement>;
    private cardExpiryHost?: ElementRef<HTMLDivElement>;
    private cardCvcHost?: ElementRef<HTMLDivElement>;

    constructor(
        private readonly cdr: ChangeDetectorRef,
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly stripeService: StripeSubscriptionsService,
        private readonly goCardlessService: GoCardlessSubscriptionsService,
        private readonly paymentsState: PaymentsStateService,
    ) { }

    ngOnInit(): void {
        this.loadCatalog();
        this.loadSubscriptionState();
        this.loadProviderConfigs();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.destroyStripeElements();
    }

    openAddForm(provider: PaymentProvider): void {
        this.showAddForm = true;
        this.addProvider = provider;
        this.resetAddForm();
        this.cdr.markForCheck();

        if (provider === 'stripe') {
            setTimeout(() => void this.tryMountStripeElements(), 0);
        }
    }

    cancelAdd(): void {
        this.showAddForm = false;
        this.destroyStripeElements();
        this.resetAddForm();
        this.cdr.markForCheck();
    }

    async saveNewPaymentMethod(): Promise<void> {
        if (this.addProvider === 'stripe') {
            await this.saveStripePaymentMethod();
        } else {
            this.saveGoCardlessPaymentMethod();
        }
    }

    setDefaultPaymentMethod(method: SavedPaymentMethod): void {
        this.paymentMethods.forEach((m) => (m.isDefault = m.id === method.id));
        this.setStatus('success', `${method.label} is now your default payment method.`);
        this.cdr.markForCheck();
    }

    removePaymentMethod(method: SavedPaymentMethod): void {
        this.paymentMethods = this.paymentMethods.filter((m) => m.id !== method.id);
        if (method.isDefault && this.paymentMethods.length) {
            this.paymentMethods[0].isDefault = true;
        }
        this.setStatus('info', `${method.label} removed.`);
        this.cdr.markForCheck();
    }

    openBillingPortal(): void {
        const customerId = this.currentSubscription?.customerId;
        if (!customerId) {
            this.setStatus('error', 'No Stripe customer profile found. Please complete a subscription first.');
            return;
        }

        this.busy = true;
        this.cdr.markForCheck();

        this.stripeService.createBillingPortalSession({
            customerId,
            returnUrl: globalThis.location.href,
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: StripeBillingPortalResponse) => {
                globalThis.location.href = res.url;
            },
            error: (err: { error?: { message?: string }; message?: string }) => {
                this.busy = false;
                const message = err?.error?.message || err?.message || 'Failed to open billing portal.';
                this.setStatus('error', message);
            },
        });
    }

    goToSubscription(): void {
        this.router.navigate([environment.routes.subscription]);
    }

    getProviderIcon(provider: PaymentProvider): string {
        return provider === 'stripe' ? 'credit_card' : 'account_balance';
    }

    canAddStripe(): boolean {
        return this.providerAvailability.stripe;
    }

    canAddGoCardless(): boolean {
        return this.providerAvailability.gocardless;
    }

    private async saveStripePaymentMethod(): Promise<void> {
        if (!this.stripeCardReady || !this.stripeCardNumberElement) {
            this.setStatus('error', 'Stripe card fields are not ready.');
            return;
        }

        this.busy = true;
        this.cdr.markForCheck();

        try {
            const stripe = await this.ensureStripeClient();
            const result = await stripe.createPaymentMethod({
                type: 'card',
                card: this.stripeCardNumberElement,
                billing_details: {
                    name: this.addCardholderName.trim() || undefined,
                },
                metadata: {},
            });

            if (result.error || !result.paymentMethod) {
                throw new Error(result.error?.message || 'Failed to create payment method.');
            }

            const pm = result.paymentMethod;
            const newMethod: SavedPaymentMethod = {
                id: pm.id,
                provider: 'stripe',
                label: `${this.capitalize(pm.card?.brand || 'Card')} •••• ${pm.card?.last4 || '????'}`,
                last4: pm.card?.last4 || undefined,
                brand: pm.card?.brand || undefined,
                expiryMonth: pm.card?.exp_month,
                expiryYear: pm.card?.exp_year,
                isDefault: this.paymentMethods.length === 0,
            };

            this.paymentMethods.push(newMethod);
            this.showAddForm = false;
            this.destroyStripeElements();
            this.setStatus('success', `${newMethod.label} added successfully.`);
            this.busy = false;
            this.cdr.markForCheck();
        } catch (err) {
            this.busy = false;
            const message = err instanceof Error ? err.message : 'Failed to save card.';
            this.setStatus('error', message);
            this.cdr.markForCheck();
        }
    }

    private saveGoCardlessPaymentMethod(): void {
        if (!this.addGcCardForm.cardholderName.trim() || !this.addGcCardForm.cardNumber.trim()
            || !this.addGcCardForm.expiration.trim() || !this.addGcCardForm.cvc.trim()) {
            this.setStatus('error', 'Please fill in all card details (card number, name, expiration date, and CVC).');
            return;
        }

        this.busy = true;
        this.cdr.markForCheck();

        const sessionToken = globalThis.crypto?.randomUUID?.() || `pm_${Date.now()}`;
        const returnUrl = globalThis.location.href;

        this.goCardlessService.createRedirectFlow({
            description: 'Add payment method',
            sessionToken,
            successRedirectUrl: returnUrl,
            prefilledCustomer: {
                givenName: this.addGcCardForm.cardholderName.trim().split(/\s+/)[0],
                familyName: this.addGcCardForm.cardholderName.trim().split(/\s+/).slice(1).join(' '),
                email: this.getBillingEmail(),
            },
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (res: { redirect_flows: { redirect_url: string } }) => {
                sessionStorage.setItem('evryka-gc-pm-session', sessionToken);
                globalThis.location.href = res.redirect_flows.redirect_url;
            },
            error: (err: { error?: { message?: string }; message?: string }) => {
                this.busy = false;
                const message = err?.error?.message || err?.message || 'Failed to set up GoCardless mandate.';
                this.setStatus('error', message);
                this.cdr.markForCheck();
            },
        });
    }

    private loadCatalog(): void {
        this.paymentsState.getCatalog()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (catalog: PaymentsCatalogResponse) => {
                    this.providerAvailability = {
                        stripe: !!catalog.providers.stripe.configured,
                        gocardless: !!catalog.providers.gocardless.configured,
                    };
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private loadSubscriptionState(): void {
        this.paymentsState.getSubscriptionState()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: PaymentSubscriptionStateResponse) => {
                    this.currentSubscription = res.subscription;
                    this.buildMethodsFromSubscription(res.subscription);
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private loadProviderConfigs(): void {
        this.stripeService.getConfig()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (cfg: StripePublicConfig) => {
                    this.stripeConfig = cfg;
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });

        this.goCardlessService.getConfig()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (cfg: GoCardlessPublicConfig) => {
                    this.goCardlessConfig = cfg;
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private buildMethodsFromSubscription(sub: PaymentSubscriptionState | null): void {
        if (!sub) {
            return;
        }

        const methods: SavedPaymentMethod[] = [];

        if (sub.provider === 'stripe' && sub.customerId) {
            methods.push({
                id: sub.customerId,
                provider: 'stripe',
                label: `Stripe card (customer ${sub.customerId.slice(-8)})`,
                isDefault: true,
            });
        }

        if (sub.provider === 'gocardless' && sub.mandateId) {
            methods.push({
                id: sub.mandateId,
                provider: 'gocardless',
                label: `GoCardless mandate (${sub.mandateId.slice(-8)})`,
                mandateId: sub.mandateId,
                isDefault: true,
            });
        }

        if (methods.length) {
            this.paymentMethods = methods;
        }
    }

    private async ensureStripeClient(): Promise<Stripe> {
        if (this.stripe) {
            return this.stripe;
        }

        const key = this.stripeConfig?.publishableKey || this.stripeService.publishableKey;
        const client = await this.stripeService.getStripeClient(key);
        this.stripe = client;
        return client;
    }

    private async tryMountStripeElements(): Promise<void> {
        if (!this.cardNumberHost || !this.cardExpiryHost || !this.cardCvcHost) {
            return;
        }

        try {
            const stripe = await this.ensureStripeClient();
            if (!this.stripeElements) {
                this.stripeElements = stripe.elements();
            }

            const sharedStyle = {
                base: {
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    '::placeholder': { color: '#64748b' },
                },
                invalid: { color: '#fca5a5' },
            };

            if (!this.stripeCardNumberElement) {
                this.stripeCardNumberElement = this.stripeElements.create('cardNumber', { style: sharedStyle, showIcon: true });
                this.stripeCardExpiryElement = this.stripeElements.create('cardExpiry', { style: sharedStyle });
                this.stripeCardCvcElement = this.stripeElements.create('cardCvc', { style: sharedStyle });

                this.stripeCardNumberElement.on('change', (ev) => {
                    this.stripeCardError = ev.error?.message || '';
                    this.cdr.markForCheck();
                });
            }

            this.mountEl(this.stripeCardNumberElement, this.cardNumberHost.nativeElement);
            this.mountEl(this.stripeCardExpiryElement, this.cardExpiryHost.nativeElement);
            this.mountEl(this.stripeCardCvcElement, this.cardCvcHost.nativeElement);
            this.stripeCardReady = true;
            this.cdr.markForCheck();
        } catch {
            this.stripeCardReady = false;
            this.stripeCardError = 'Failed to load Stripe.js.';
            this.cdr.markForCheck();
        }
    }

    private mountEl(
        el: StripeCardNumberElement | StripeCardExpiryElement | StripeCardCvcElement | undefined,
        host: HTMLDivElement,
    ): void {
        if (!el || host.childNodes.length > 0) {
            return;
        }
        el.mount(host);
    }

    private destroyStripeElements(): void {
        this.stripeCardNumberElement?.destroy();
        this.stripeCardExpiryElement?.destroy();
        this.stripeCardCvcElement?.destroy();
        this.stripeElements = undefined;
        this.stripeCardNumberElement = undefined;
        this.stripeCardExpiryElement = undefined;
        this.stripeCardCvcElement = undefined;
        this.stripeCardReady = false;
        this.stripeCardError = '';
    }

    private resetAddForm(): void {
        this.addCardholderName = '';
        this.addGcCardForm = {
            cardholderName: '',
            cardNumber: '',
            expiration: '',
            cvc: '',
        };
        this.stripeCardError = '';
        this.statusMessage = '';
    }

    private getBillingEmail(): string {
        const userId = sessionStorage.getItem(environment.storage.userId);
        const token = userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) : null;
        if (!token) {
            return '';
        }
        const decoded = this.authService.decodeJWTToken(token);
        return decoded?.user?.email || '';
    }

    private setStatus(tone: 'info' | 'success' | 'error', message: string): void {
        this.statusTone = tone;
        this.statusMessage = message;
        this.cdr.markForCheck();
    }

    private capitalize(val: string): string {
        return val ? val.charAt(0).toUpperCase() + val.slice(1) : val;
    }
}
