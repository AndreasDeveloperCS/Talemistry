import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';
import {
    GoCardlessPublicConfig,
    GoCardlessSubscriptionsService,
} from '../../../payments/services/gocardless-subscriptions.service';
import {
    PaymentCatalogBillingOption,
    PaymentProvider,
    PaymentsCatalogResponse,
    PaymentSubscriptionState,
    PaymentsStateService,
} from '../../../payments/services/payments-state.service';
import {
    StripeCheckoutSessionResponse,
    StripePublicConfig,
    StripeSubscriptionsService,
} from '../../../payments/services/stripe-subscriptions.service';
import { User } from '../../../users/models/user';
import { UsersService } from '../../../users/services/users.service';
import { PRICING_PLANS, PricingPlan } from '../../models/pricing-plan.data';

export type SubscriptionStep = 'select-plan' | 'authenticate' | 'confirm-details' | 'checkout';
export type AuthMode = 'login' | 'signup';

type SubscriptionPlanCardViewModel = {
    plan: PricingPlan;
    amount: number;
    hasFixedPrice: boolean;
    periodLabel: 'month' | 'year';
};

@Component({
    selector: 'app-subscription',
    templateUrl: './subscription.component.html',
    styleUrls: ['./subscription.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionComponent implements OnInit, OnDestroy {

    readonly pricingPlans = PRICING_PLANS;
    readonly yearlyDiscountPercent = 16.7;
    readonly stripeProviderTitle = 'Stripe';
    readonly goCardlessProviderTitle = 'GoCardless';

    currentStep: SubscriptionStep = 'select-plan';
    authMode: AuthMode = 'login';
    billingCycle: 'monthly' | 'yearly' = 'monthly';
    isUserAuthenticated = false;
    planCards: SubscriptionPlanCardViewModel[] = [];
    selectedPlan?: PricingPlan;
    selectedPlanAmount = 0;
    selectedPlanHasFixedPrice = false;
    selectedPlanPeriodLabel: 'month' | 'year' = 'month';
    currentUser?: User;
    selectedProvider: PaymentProvider = 'stripe';
    selectedProviderTitle = this.stripeProviderTitle;
    selectedProviderMeta = 'Waiting for Stripe plan configuration';
    stripeConfig?: StripePublicConfig;
    goCardlessConfig?: GoCardlessPublicConfig;
    paymentCatalog?: PaymentsCatalogResponse;
    currentSubscription: PaymentSubscriptionState | null = null;
    providerAvailability: Record<PaymentProvider, boolean> = {
        stripe: false,
        gocardless: false,
    };

    busy = false;
    busyAction = '';
    statusTone: 'info' | 'success' | 'error' = 'info';
    statusMessage = 'Select a plan to get started with your subscription.';

    billingForm = {
        email: '',
        givenName: '',
        familyName: '',
    };

    stripeForm = {
        email: '',
        name: '',
        priceId: '',
        customerId: '',
        customerEmail: '',
        successUrl: '',
        cancelUrl: '',
        subscriptionId: '',
        returnUrl: '',
    };

    goCardlessForm = {
        description: 'EVRYKA subscription setup',
        sessionToken: '',
        successRedirectUrl: '',
        redirectFlowId: '',
        mandateId: '',
        subscriptionId: '',
        currency: 'EUR',
    };

    cardForm = {
        cardholderName: '',
        cardNumber: '',
        expiration: '',
        cvc: '',
    };

    gcCardForm = {
        cardholderName: '',
        cardNumber: '',
        expiration: '',
        cvc: '',
    };

    private readonly destroy$ = new Subject<void>();
    private readonly goCardlessSessionStorageKey = 'evryka-gocardless-session-token';
    private lastCheckoutUrlKey = '';

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly cdr: ChangeDetectorRef,
        private readonly authService: AuthService,
        private readonly stripeSubscriptionsService: StripeSubscriptionsService,
        private readonly goCardlessSubscriptionsService: GoCardlessSubscriptionsService,
        private readonly paymentsStateService: PaymentsStateService,
        private readonly usersService: UsersService,
    ) {
        window.scrollTo(0, 0);
    }

    ngOnInit(): void {
        this.prefillBillingFromSession();
        this.loadPaymentsCatalog();
        this.handleQueryParams();
        this.subscribeToAuthChanges();
        this.refreshViewState();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    selectPlan(plan: PricingPlan): void {
        if (plan.id === 'enterprise') {
            this.navigateToContactSales();
            return;
        }

        this.selectedPlan = plan;
        this.goCardlessForm.description = `EVRYKA ${plan.name} subscription`;
        this.applyCatalogSelection();
        this.syncProviderSelection();
        this.setStatus('info', `You selected the ${plan.name} plan.`);

        if (this.isUserAuthenticated) {
            this.updateCurrentStep();
            //this.currentStep = plan.id === 'freemium' ? 'confirm-details' : 'checkout';
            if (plan.id !== 'freemium') {
                this.loadProviderConfigs();
            }
        } else {
            this.authMode = plan.id === 'freemium' ? 'signup' : 'login';
            this.updateCurrentStep();
            //this.currentStep = 'authenticate';
        }

        this.updateQueryParams();
        this.refreshViewState();
        this.cdr.markForCheck();
    }

    setBillingCycle(cycle: 'monthly' | 'yearly'): void {
        this.billingCycle = cycle;
        this.applyCatalogSelection();
        this.syncProviderSelection();
        this.updateQueryParams();
        this.refreshViewState();
        this.cdr.markForCheck();
    }

    setSelectedProvider(provider: PaymentProvider): void {
        if (!this.isProviderSelectable(provider)) {
            return;
        }

        this.selectedProvider = provider;
        this.refreshSelectedProviderView();
        this.cdr.markForCheck();
    }

    trackByPlanId(_index: number, planCard: SubscriptionPlanCardViewModel): string {
        return planCard.plan.id;
    }

    navigateToLogin(): void {
        this.router.navigate([environment.routes.auth.login], {
            queryParams: { returnUrl: this.buildReturnUrl() },
        });
    }

    navigateToSignup(): void {
        this.router.navigate([environment.routes.auth.register], {
            queryParams: { returnUrl: this.buildReturnUrl() },
        });
    }

    navigateToContactSales(): void {
        this.router.navigate([environment.routes.contactUs], {
            queryParams: {
                subject: 'Enterprise Plan Inquiry',
                source: 'subscription-page',
            },
        });
    }

    goBackToPlans(): void {
        this.selectedPlan = undefined;
        this.updateCurrentStep();
        //this.currentStep = 'select-plan';
        this.cdr.markForCheck();
    }

    proceedToCheckout(): void {
        if (!this.selectedPlan) {
            this.setStatus('error', 'Please select a plan first.');
            return;
        }

        if (this.selectedPlan.id === 'freemium') {
            this.confirmFreemiumSubscription();
            return;
        }

        // if (!this.validateBillingDetails()) {
        //     return;
        // }

        if (this.selectedProvider === 'stripe') {
            void this.startStripeCheckout();
            return;
        }

        this.startGoCardlessFlow();
    }

    confirmFreemiumSubscription(): void {
        this.setStatus('success', 'Welcome! Your free account is ready. Redirecting to your dashboard...');
        this.busy = true;
        this.cdr.markForCheck();

        setTimeout(() => {
            this.busy = false;
            this.router.navigate([environment.routes.user, 'profile']);
        }, 2000);
    }

    openBillingPortal(): void {
        if (!this.stripeForm.customerId) {
            this.setStatus('error', 'A Stripe customer profile is required before opening the billing portal.');
            return;
        }

        this.runAction('Opening billing portal', () =>
            this.stripeSubscriptionsService.createBillingPortalSession({
                customerId: this.stripeForm.customerId,
                returnUrl: this.stripeForm.returnUrl,
            }).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.setStatus('success', 'Redirecting to the Stripe billing portal.');
                    globalThis.location.href = response.url;
                },
                error: (error) => this.handleActionError('Opening billing portal', error),
            })
        );
    }

    getBillingAmount(): number {
        if (!this.selectedPlan) {
            return 0;
        }

        return this.billingCycle === 'yearly'
            ? (this.selectedPlan.yearlyPrice ?? 0)
            : (this.selectedPlan.monthlyPrice ?? 0);
    }

    getPlanPrice(plan: PricingPlan): number {
        return this.billingCycle === 'yearly'
            ? (plan.yearlyPrice ?? 0)
            : (plan.monthlyPrice ?? 0);
    }

    hasFixedPrice(plan: PricingPlan): boolean {
        return plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined;
    }

    hasConfiguredStripePrice(): boolean {
        return this.isProviderEnabled('stripe') && !!this.getResolvedStripePriceId();
    }

    // canProceedWithSelectedProvider(): boolean {
    //     if (this.busy || !this.selectedPlan) {
    //         return false;
    //     }

    //     if (this.selectedProvider === 'stripe') {
    //         return this.hasConfiguredStripePrice()
    //             && !!this.cardForm.cardholderName.trim()
    //             && !!this.cardForm.cardNumber.trim()
    //             && !!this.cardForm.expiration.trim()
    //             && !!this.cardForm.cvc.trim();
    //     }

    //     return this.isProviderSelectable('gocardless')
    //         && !!this.gcCardForm.cardholderName.trim()
    //         && !!this.gcCardForm.cardNumber.trim()
    //         && !!this.gcCardForm.expiration.trim()
    //         && !!this.gcCardForm.cvc.trim();
    // }

    canProceedWithSelectedProvider(): boolean {
        if (this.busy || !this.selectedPlan) {
            return false;
        }

        return true;
    }

    canOpenBillingPortal(): boolean {
        return !this.busy && !!this.stripeForm.customerId;
    }

    getProviderTitle(provider: PaymentProvider): string {
        return provider === 'stripe' ? 'Stripe' : 'GoCardless';
    }

    getProviderDescription(provider: PaymentProvider): string {
        if (provider === 'stripe') {
            return this.hasConfiguredStripePrice()
                ? 'Continue to secure Stripe checkout after entering the same editable card form.'
                : 'Stripe is available, but this plan does not have a Stripe price configured yet.';
        }

        return 'Launches a secure GoCardless billing flow using the same editable card form.';
    }

    getProviderCtaLabel(): string {
        return this.selectedProvider === 'stripe'
            ? 'Continue to Stripe'
            : 'Continue to GoCardless';
    }

    getSelectedProviderMeta(): string {
        if (this.selectedProvider === 'stripe') {
            return this.getResolvedStripePriceId() || 'Waiting for Stripe plan configuration';
        }

        return this.goCardlessConfig?.environment || 'Awaiting GoCardless configuration';
    }

    isProviderSelectableForView(provider: PaymentProvider): boolean {
        return this.isProviderSelectable(provider);
    }

    onCardNumberInput(eventOrValue: Event | string, target: 'stripe' | 'gocardless'): void {
        const input = eventOrValue instanceof Event ? (eventOrValue.target as HTMLInputElement) : undefined;
        const rawValue = typeof eventOrValue === 'string' ? eventOrValue : (input?.value || '');
        const digits = rawValue.replace(/\D/g, '').slice(0, 16);
        const formatted = digits.replace(/(.{4})/g, '$1 ').trimEnd();

        if (input) {
            input.value = formatted;
        }

        if (target === 'stripe') {
            this.cardForm.cardNumber = formatted;
        } else {
            this.gcCardForm.cardNumber = formatted;
        }
    }

    onExpirationInput(eventOrValue: Event | string, target: 'stripe' | 'gocardless'): void {
        const input = eventOrValue instanceof Event ? (eventOrValue.target as HTMLInputElement) : undefined;
        const rawValue = typeof eventOrValue === 'string' ? eventOrValue : (input?.value || '');
        const digits = rawValue.replace(/\D/g, '').slice(0, 4);
        let formatted = digits;

        if (digits.length >= 3) {
            formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
        } else if (digits.length === 2 && !rawValue.includes('/')) {
            formatted = `${digits} / `;
        }

        if (input) {
            input.value = formatted;
        }

        if (target === 'stripe') {
            this.cardForm.expiration = formatted;
        } else {
            this.gcCardForm.expiration = formatted;
        }
    }

    onCvcInput(eventOrValue: Event | string, target: 'stripe' | 'gocardless'): void {
        const input = eventOrValue instanceof Event ? (eventOrValue.target as HTMLInputElement) : undefined;
        const rawValue = typeof eventOrValue === 'string' ? eventOrValue : (input?.value || '');
        const digits = rawValue.replace(/\D/g, '').slice(0, 4);

        if (input) {
            input.value = digits;
        }

        if (target === 'stripe') {
            this.cardForm.cvc = digits;
        } else {
            this.gcCardForm.cvc = digits;
        }
    }

    private subscribeToAuthChanges(): void {

        this.authService.loginStatus$
            .pipe(takeUntil(this.destroy$))
            .subscribe(isLoggedIn => {

                this.isUserAuthenticated = isLoggedIn;

                if (isLoggedIn) {

                    this.loadProviderConfigs();
                    this.loadCurrentSubscriptionState();
                    this.loadCurrentUserProfile();
                }

                this.updateCurrentStep();
                this.refreshViewState();

                this.cdr.markForCheck();
            });

    }

    get currentStepIndex(): number {

        if (!this.selectedPlan)
            return 1;

        if (!this.isUserAuthenticated)
            return 2;

        return 3;
    }

    private updateCurrentStep(): void {

        if (!this.selectedPlan) {
            this.currentStep = 'select-plan';
            return;
        }

        if (!this.isUserAuthenticated) {
            this.currentStep = 'authenticate';
            return;
        }

        if (this.selectedPlan.id === 'freemium') {
            this.currentStep = 'confirm-details';
            return;
        }

        this.currentStep = 'checkout';
        console.log('Current step updated to checkout for plan:', this.selectedPlan.id, 'User authenticated:', this.isUserAuthenticated, 
            'Current step index:', this.currentStep
        );
    }

    private handleQueryParams(): void {
        this.route.queryParamMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const planId = params.get('plan');
                const billing = params.get('billing') as 'monthly' | 'yearly' | null;
                const stripeStatus = params.get('stripe');
                const redirectFlowId = params.get('redirect_flow_id');

                if (planId) {
                    const plan = this.pricingPlans.find((pricingPlan) => pricingPlan.id === planId);
                    if (plan) {
                        this.selectedPlan = plan;
                        this.goCardlessForm.description = `EVRYKA ${plan.name} subscription`;
                    }
                }

                if (billing === 'monthly' || billing === 'yearly') {
                    this.billingCycle = billing;
                }

                if (stripeStatus === 'success') {
                    this.setStatus('success', 'Payment successful. Your subscription is now active.');
                    this.loadCurrentSubscriptionState();
                } else if (stripeStatus === 'cancelled') {
                    this.setStatus('info', 'Payment was cancelled. You can try again when ready.');
                }

                if (redirectFlowId) {
                    this.goCardlessForm.redirectFlowId = redirectFlowId;
                    const storedSessionToken = sessionStorage.getItem(this.goCardlessSessionStorageKey) || '';
                    if (storedSessionToken) {
                        this.goCardlessForm.sessionToken = storedSessionToken;
                        this.completeGoCardlessRedirectFlow();
                    }
                }

                this.applyCatalogSelection();
                this.syncProviderSelection();
                this.checkAuthenticationState();
            });
    }

    private checkAuthenticationState(): void {
        // this.isUserAuthenticated = this.authService.isAuthenticated();

        if (this.isUserAuthenticated) {
            this.loadProviderConfigs();
            this.loadCurrentSubscriptionState();
            this.loadCurrentUserProfile();

            if (this.selectedPlan) {
                this.updateCurrentStep();
                //this.currentStep = this.selectedPlan.id === 'freemium' ? 'confirm-details' : 'checkout';
            }
        } else {
            this.updateCurrentStep();
            //this.currentStep = this.selectedPlan ? 'authenticate' : 'select-plan';
        }

        this.refreshViewState();
        this.cdr.markForCheck();
    }

    private async startStripeCheckout(): Promise<void> {
        if (!this.hasConfiguredStripePrice()) {
            this.setStatus('error', 'No Stripe price is configured for this plan and billing cycle.');
            return;
        }

        this.syncProviderBillingFields();

        this.runAction('Creating Stripe checkout session', () =>
            this.stripeSubscriptionsService.createCheckoutSession({
                priceId: this.getResolvedStripePriceId(),
                planId: this.selectedPlan?.id,
                billingCycle: this.billingCycle,
                successUrl: this.stripeForm.successUrl,
                cancelUrl: this.stripeForm.cancelUrl,
                customerId: this.stripeForm.customerId || undefined,
                customerEmail: this.stripeForm.customerId ? undefined : this.billingForm.email,
                metadata: this.getPlanMetadata(),
            }).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    void this.redirectToStripeCheckout(response).catch((error) => {
                        this.handleActionError('Redirecting to Stripe checkout', error);
                    });
                },
                error: (error) => this.handleActionError('Creating Stripe checkout session', error),
            })
        );
    }

    private startGoCardlessFlow(): void {
        if (!this.isProviderSelectable('gocardless')) {
            this.setStatus('error', 'GoCardless is not configured in the current environment.');
            return;
        }

        this.goCardlessForm.sessionToken = this.goCardlessForm.sessionToken || this.createSessionToken();
        this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
        sessionStorage.setItem(this.goCardlessSessionStorageKey, this.goCardlessForm.sessionToken);

        this.runAction('Setting up direct debit', () =>
            this.goCardlessSubscriptionsService.createRedirectFlow({
                description: this.goCardlessForm.description,
                sessionToken: this.goCardlessForm.sessionToken,
                successRedirectUrl: this.goCardlessForm.successRedirectUrl,
                prefilledCustomer: {
                    email: this.billingForm.email,
                    givenName: this.gcCardForm.cardholderName.trim().split(/\s+/)[0] || this.billingForm.givenName,
                    familyName: this.gcCardForm.cardholderName.trim().split(/\s+/).slice(1).join(' ') || this.billingForm.familyName,
                },
            }).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.goCardlessForm.redirectFlowId = response.redirect_flows.id;
                    this.setStatus('success', 'Redirecting to GoCardless...');
                    globalThis.location.href = response.redirect_flows.redirect_url;
                },
                error: (error) => this.handleActionError('Setting up direct debit', error),
            })
        );
    }

    private completeGoCardlessRedirectFlow(): void {
        if (!this.goCardlessForm.redirectFlowId || !this.goCardlessForm.sessionToken) {
            return;
        }

        this.runAction('Completing mandate setup', () =>
            this.goCardlessSubscriptionsService.completeRedirectFlow({
                redirectFlowId: this.goCardlessForm.redirectFlowId,
                sessionToken: this.goCardlessForm.sessionToken,
            }).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.goCardlessForm.mandateId = response.redirect_flows.links?.mandate || this.goCardlessForm.mandateId;
                    this.loadCurrentSubscriptionState();
                    this.setStatus('success', 'Direct debit mandate created successfully.');
                    this.createGoCardlessSubscription();
                },
                error: (error) => this.handleActionError('Completing mandate setup', error),
            })
        );
    }

    private createGoCardlessSubscription(): void {
        if (!this.goCardlessForm.mandateId || !this.selectedPlan) {
            return;
        }

        const selectedPlan = this.selectedPlan;
        const amount = Math.round(this.getBillingAmount() * 100);
        if (!amount) {
            this.setStatus('error', 'Invalid plan amount.');
            return;
        }

        this.runAction('Creating subscription', () =>
            this.goCardlessSubscriptionsService.createSubscription({
                mandateId: this.goCardlessForm.mandateId,
                amount,
                currency: this.goCardlessForm.currency,
                planId: selectedPlan.id,
                billingCycle: this.billingCycle,
                name: `EVRYKA ${selectedPlan.name}`,
                interval: 1,
                intervalUnit: this.billingCycle === 'yearly' ? 'yearly' : 'monthly',
                metadata: this.getPlanMetadata(),
            }).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.goCardlessForm.subscriptionId = response.subscriptions.id;
                    sessionStorage.removeItem(this.goCardlessSessionStorageKey);
                    this.loadCurrentSubscriptionState();
                    this.setStatus('success', 'Subscription created successfully.');
                    this.cdr.markForCheck();
                },
                error: (error) => this.handleActionError('Creating subscription', error),
            })
        );
    }

    private loadProviderConfigs(): void {
        this.stripeSubscriptionsService.getConfig()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (config) => {
                    this.stripeConfig = config;
                    this.refreshSelectedProviderView();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.stripeConfig = {
                        provider: 'stripe',
                        publishableKey: this.stripeSubscriptionsService.publishableKey,
                    };
                    this.refreshSelectedProviderView();
                    this.cdr.markForCheck();
                },
            });

        this.goCardlessSubscriptionsService.getConfig()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (config) => {
                    this.goCardlessConfig = config;
                    this.refreshSelectedProviderView();
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private loadPaymentsCatalog(): void {
        this.paymentsStateService.getCatalog()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (catalog) => {
                    this.paymentCatalog = catalog;
                    this.providerAvailability = {
                        stripe: !!catalog.providers.stripe.configured,
                        gocardless: !!catalog.providers.gocardless.configured,
                    };
                    this.applyCatalogSelection();
                    this.syncProviderSelection();
                    this.refreshViewState();
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private loadCurrentSubscriptionState(): void {
        this.paymentsStateService.getSubscriptionState()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.currentSubscription = response.subscription;
                    if (response.subscription?.provider) {
                        this.selectedProvider = response.subscription.provider;
                    }
                    this.applyBillingContact();
                    this.syncProviderSelection();
                    this.refreshViewState();
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private loadCurrentUserProfile(): void {
        const userId = sessionStorage.getItem(environment.storage.userId);
        if (!userId || !this.isUserAuthenticated) {
            return;
        }

        this.usersService.getByIdAsync(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user) => {
                    this.currentUser = user;
                    this.applyBillingContact();
                    this.refreshViewState();
                    this.cdr.markForCheck();
                },
                error: () => this.cdr.markForCheck(),
            });
    }

    private applyCatalogSelection(): void {
        this.stripeForm.priceId = this.getResolvedStripePriceId();
        this.syncCheckoutUrls();
        this.refreshSelectedPlanView();
        this.refreshSelectedProviderView();
    }

    private prefillBillingFromSession(): void {
        const userId = sessionStorage.getItem(environment.storage.userId);
        const token = (userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) : null)
            || sessionStorage.getItem(environment.storage.token)
            || '';
        const decoded = this.authService.decodeJWTToken(token);
        const tokenUser = decoded?.user ?? {};

        const currentUserJson = sessionStorage.getItem(environment.storage.currentUser);
        const sessionUser = currentUserJson ? (() => { try { return JSON.parse(currentUserJson); } catch { return {}; } })() : {};

        const pick = (...values: unknown[]) => values.find((v) => typeof v === 'string' && v.trim()) as string | undefined;

        const email = pick(tokenUser?.email, sessionUser?.email);
        const givenName = pick(tokenUser?.firstname, tokenUser?.firstName, sessionUser?.firstname, sessionUser?.firstName);
        const familyName = pick(tokenUser?.lastname, tokenUser?.lastName, sessionUser?.lastname, sessionUser?.lastName);
        const fullName = pick(tokenUser?.fullName, tokenUser?.displayName, sessionUser?.fullName, sessionUser?.displayName);

        if (email) { this.billingForm.email = this.billingForm.email || email; }
        if (givenName) { this.billingForm.givenName = this.billingForm.givenName || givenName; }
        if (familyName) { this.billingForm.familyName = this.billingForm.familyName || familyName; }

        if ((!this.billingForm.givenName || !this.billingForm.familyName) && fullName) {
            const [first, ...rest] = fullName.trim().split(/\s+/);
            this.billingForm.givenName = this.billingForm.givenName || first || '';
            this.billingForm.familyName = this.billingForm.familyName || rest.join(' ');
        }
    }

    private applyBillingContact(): void {
        const billingContact = this.currentSubscription?.billingContact;
        if (billingContact) {
            this.billingForm.email = this.billingForm.email || billingContact.email || '';
            this.billingForm.givenName = this.billingForm.givenName || billingContact.givenName || '';
            this.billingForm.familyName = this.billingForm.familyName || billingContact.familyName || '';

            if ((!this.billingForm.givenName || !this.billingForm.familyName) && billingContact.fullName) {
                const [firstName, ...rest] = billingContact.fullName.trim().split(/\s+/);
                this.billingForm.givenName = this.billingForm.givenName || firstName || '';
                this.billingForm.familyName = this.billingForm.familyName || rest.join(' ');
            }

            this.stripeForm.customerId = this.stripeForm.customerId || this.currentSubscription?.customerId || '';
            this.stripeForm.subscriptionId = this.stripeForm.subscriptionId || this.currentSubscription?.subscriptionId || '';
            this.goCardlessForm.mandateId = this.goCardlessForm.mandateId || this.currentSubscription?.mandateId || '';
            this.goCardlessForm.subscriptionId = this.goCardlessForm.subscriptionId || this.currentSubscription?.subscriptionId || '';
            this.goCardlessForm.redirectFlowId = this.goCardlessForm.redirectFlowId || this.currentSubscription?.redirectFlowId || '';
        }

        if (!this.currentUser) {
            return;
        }

        this.billingForm.email = this.billingForm.email || this.currentUser.email || '';
        this.billingForm.givenName = this.billingForm.givenName || this.currentUser.firstname || '';
        this.billingForm.familyName = this.billingForm.familyName || this.currentUser.lastname || '';
        this.syncProviderBillingFields();
    }

    private syncProviderSelection(): void {
        const availableProviders = this.getAvailableProvidersForSelection();
        if (!availableProviders.length) {
            return;
        }

        if (!availableProviders.includes(this.selectedProvider)) {
            const preferredProvider = this.getPreferredProvider();
            this.selectedProvider = preferredProvider && availableProviders.includes(preferredProvider)
                ? preferredProvider
                : availableProviders[0];
        }

        this.refreshSelectedProviderView();
    }

    private refreshViewState(): void {
        // this.isUserAuthenticated = this.authService.isAuthenticated();
        this.planCards = this.pricingPlans.map((plan) => ({
            plan,
            amount: this.getPlanPrice(plan),
            hasFixedPrice: this.hasFixedPrice(plan),
            periodLabel: this.billingCycle === 'yearly' ? 'year' : 'month',
        }));
        this.refreshSelectedPlanView();
        this.refreshSelectedProviderView();
    }

    private refreshSelectedPlanView(): void {
        this.selectedPlanAmount = this.getBillingAmount();
        this.selectedPlanHasFixedPrice = !!this.selectedPlan && this.hasFixedPrice(this.selectedPlan);
        this.selectedPlanPeriodLabel = this.billingCycle === 'yearly' ? 'year' : 'month';
    }

    private refreshSelectedProviderView(): void {
        this.selectedProviderTitle = this.selectedProvider === 'stripe'
            ? this.stripeProviderTitle
            : this.goCardlessProviderTitle;
        this.selectedProviderMeta = this.selectedProvider === 'stripe'
            ? (this.getResolvedStripePriceId() || 'Waiting for Stripe plan configuration')
            : (this.goCardlessConfig?.environment || 'Awaiting GoCardless configuration');
    }

    private getPreferredProvider(): PaymentProvider | undefined {
        return this.paymentCatalog?.plans.find((plan) => plan.id === this.selectedPlan?.id)?.preferredProvider;
    }

    private getAvailableProvidersForSelection(): PaymentProvider[] {
        const availableProviders: PaymentProvider[] = [];

        if (this.isProviderSelectable('stripe')) {
            availableProviders.push('stripe');
        }

        if (this.isProviderSelectable('gocardless')) {
            availableProviders.push('gocardless');
        }

        return availableProviders;
    }

    private isProviderSelectable(provider: PaymentProvider): boolean {
        if (!this.selectedPlan || this.selectedPlan.id === 'freemium' || this.selectedPlan.id === 'enterprise') {
            return false;
        }

        if (!this.isProviderEnabled(provider)) {
            return false;
        }

        return provider === 'stripe'
            ? !!this.getResolvedStripePriceId()
            : true;
    }

    private isProviderEnabled(provider: PaymentProvider): boolean {
        return !!this.providerAvailability[provider];
    }

    private getSelectedBillingOption(): PaymentCatalogBillingOption | undefined {
        if (!this.paymentCatalog || !this.selectedPlan) {
            return undefined;
        }

        const catalogPlan = this.paymentCatalog.plans.find((plan) => plan.id === this.selectedPlan?.id);
        return this.billingCycle === 'yearly' ? catalogPlan?.yearly : catalogPlan?.monthly;
    }

    private getResolvedStripePriceId(): string {
        return this.getSelectedBillingOption()?.stripePriceId || '';
    }

    private validateBillingDetails(): boolean {
        if (!this.billingForm.email || !this.billingForm.givenName || !this.billingForm.familyName) {
            this.setStatus('error', 'Please fill in the billing email, name, and surname fields.');
            return false;
        }

        if (this.selectedProvider === 'stripe' && (
            !this.cardForm.cardholderName.trim()
            || !this.cardForm.cardNumber.trim()
            || !this.cardForm.expiration.trim()
            || !this.cardForm.cvc.trim()
        )) {
            this.setStatus('error', 'Please fill in all Stripe card fields before continuing.');
            return false;
        }

        if (this.selectedProvider === 'gocardless' && (
            !this.gcCardForm.cardholderName.trim()
            || !this.gcCardForm.cardNumber.trim()
            || !this.gcCardForm.expiration.trim()
            || !this.gcCardForm.cvc.trim()
        )) {
            this.setStatus('error', 'Please fill in all GoCardless card fields before continuing.');
            return false;
        }

        return true;
    }

    private getPlanMetadata(): Record<string, string> {
        return {
            planId: this.selectedPlan?.id || '',
            planName: this.selectedPlan?.name || '',
            billingCycle: this.billingCycle,
            cardholderName: this.selectedProvider === 'gocardless' ? this.gcCardForm.cardholderName : this.cardForm.cardholderName,
            source: 'subscription-page',
        };
    }

    private getBillingFullName(): string {
        return [this.billingForm.givenName, this.billingForm.familyName]
            .filter((value) => !!String(value || '').trim())
            .join(' ');
    }

    private buildReturnUrl(): string {
        return this.router.serializeUrl(
            this.router.createUrlTree([environment.routes.subscription], {
                queryParams: this.getSubscriptionQueryParams(),
            })
        );
    }

    private getSubscriptionQueryParams(): Record<string, string> {
        const queryParams: Record<string, string> = {
            billing: this.billingCycle,
        };

        if (this.selectedPlan?.id) {
            queryParams['plan'] = this.selectedPlan.id;
        }

        return queryParams;
    }

    private buildAbsoluteSubscriptionUrl(queryParams?: Record<string, string>): string {
        const origin = globalThis.location?.origin || environment.sourceUrl.replace(/\/+$/, '');
        const queryString = new URLSearchParams(queryParams || {}).toString();
        const baseUrl = `${origin}/${environment.routes.subscription}`;

        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }

    private buildGoCardlessSuccessRedirectUrl(): string {
        return this.buildAbsoluteSubscriptionUrl({
            provider: 'gocardless',
            ...this.getSubscriptionQueryParams(),
        });
    }

    private async redirectToStripeCheckout(response: StripeCheckoutSessionResponse): Promise<void> {
        this.setStatus('success', 'Redirecting to secure Stripe checkout.');

        if (response.url) {
            globalThis.location.href = response.url;
            return;
        }

        throw new Error('Stripe checkout session did not include a hosted checkout URL.');
    }

    private syncCheckoutUrls(): void {
        const fullUrl = this.buildAbsoluteSubscriptionUrl(this.getSubscriptionQueryParams());

        if (fullUrl === this.lastCheckoutUrlKey) {
            return;
        }

        this.lastCheckoutUrlKey = fullUrl;
        const separator = fullUrl.includes('?') ? '&' : '?';

        this.stripeForm.successUrl = `${fullUrl}${separator}stripe=success`;
        this.stripeForm.cancelUrl = `${fullUrl}${separator}stripe=cancelled`;
        this.stripeForm.returnUrl = fullUrl;
        this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
    }

    private syncProviderBillingFields(): void {
        const cardholderName = this.cardForm.cardholderName.trim();
        const fullName = cardholderName || this.getBillingFullName();

        this.stripeForm.email = this.billingForm.email;
        this.stripeForm.customerEmail = this.billingForm.email;
        this.stripeForm.name = fullName;

        if (!this.cardForm.cardholderName && fullName) {
            this.cardForm.cardholderName = fullName;
        }

        if (!this.gcCardForm.cardholderName && fullName) {
            this.gcCardForm.cardholderName = fullName;
        }
    }

    private updateQueryParams(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: this.getSubscriptionQueryParams(),
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private createSessionToken(): string {
        return globalThis.crypto?.randomUUID?.() || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    private setStatus(tone: 'info' | 'success' | 'error', message: string): void {
        this.statusTone = tone;
        this.statusMessage = message;
        if (tone !== 'info') {
            this.busy = false;
            this.busyAction = '';
        }
        this.cdr.markForCheck();
    }

    private runAction(description: string, fn: () => void): void {
        this.busy = true;
        this.busyAction = description;
        this.setStatus('info', `${description}...`);
        fn();
    }

    private handleActionError(action: string, error: unknown): void {
        const resolvedError = error as { error?: { message?: string }; message?: string };
        const message = resolvedError?.error?.message || resolvedError?.message || 'An unexpected error occurred.';
        this.busy = false;
        this.busyAction = '';
        this.setStatus('error', `${action} failed: ${message}`);
        console.error(`${action} error:`, error);
    }

}
