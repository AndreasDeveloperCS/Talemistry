import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';
import { GoCardlessPublicConfig, GoCardlessSubscriptionsService } from '../../../payments/services/gocardless-subscriptions.service';
import { PaymentBillingContact, PaymentCatalogPlan, PaymentProvider, PaymentSubscriptionState, PaymentsCatalogResponse, PaymentsStateService } from '../../../payments/services/payments-state.service';
import { StripeCheckoutSessionResponse, StripePublicConfig, StripeSubscriptionsService } from '../../../payments/services/stripe-subscriptions.service';
import { User } from '../../../users/models/user';
import { UsersService } from '../../../users/services/users.service';
import { PRICING_PLANS, PricingPlan } from '../../models/pricing-plan.data';

type CheckoutProviderViewState = {
  selectable: boolean;
  unavailableReason: string;
  badge: string;
  stateLabel: string;
  supportCopy: string;
  ready: boolean;
};

@Component({
  selector: 'app-subscription-checkout',
  templateUrl: './subscription-checkout.component.html',
  styleUrl: './subscription-checkout.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionCheckoutComponent implements OnInit, OnDestroy {
  readonly pricingPlans = PRICING_PLANS.filter((plan) => plan.id !== 'freemium' && plan.id !== 'enterprise');
  readonly yearlyDiscountPercent = 16.7;
  readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  selectedPlan?: PricingPlan;
  currentUser?: User;
  selectedProvider: 'stripe' | 'gocardless' = 'stripe';
  busy = false;
  checkoutAttempted = false;
  busyAction = '';
  statusTone: 'info' | 'success' | 'error' = 'info';
  statusMessage = 'Choose your billing details and continue to secure subscription checkout.';
  stripeConfig?: StripePublicConfig;
  goCardlessConfig?: GoCardlessPublicConfig;
  paymentCatalog?: PaymentsCatalogResponse;
  currentSubscription: PaymentSubscriptionState | null = null;
  providerAvailability: Record<PaymentProvider, boolean> = {
    stripe: false,
    gocardless: false,
  };
  providerViewState: Record<PaymentProvider, CheckoutProviderViewState> = {
    stripe: {
      selectable: false,
      unavailableReason: 'Select a subscription plan before choosing a payment provider.',
      badge: 'Cards and wallets',
      stateLabel: 'Setup needed',
      supportCopy: 'Hosted Stripe checkout will unlock as soon as the backend Stripe secret is configured for this environment.',
      ready: false,
    },
    gocardless: {
      selectable: false,
      unavailableReason: 'Select a subscription plan before choosing a payment provider.',
      badge: 'Card billing',
      stateLabel: 'Unavailable',
      supportCopy: 'GoCardless is not configured for this environment yet.',
      ready: false,
    },
  };
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
    subscriptionId: '',
    successUrl: '',
    cancelUrl: '',
    returnUrl: '',
  };
  goCardlessForm = {
    email: '',
    givenName: '',
    familyName: '',
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
  bankMandateForm = {
    accountHolderName: '',
    iban: '',
    sortCode: '',
    bankName: '',
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
  private manualProviderSelection = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private stripeSubscriptionsService: StripeSubscriptionsService,
    private goCardlessSubscriptionsService: GoCardlessSubscriptionsService,
    private paymentsStateService: PaymentsStateService,
    private usersService: UsersService,
  ) {
    window.scrollTo(0, 0);
    this.syncCheckoutUrls();
    this.refreshProviderViewState();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }

    this.applyBillingContact(this.getBillingContactFromSession(), { preferIncoming: true });
    this.refreshProviderViewState();
    this.loadProviderConfigs();
    this.loadPaymentsCatalog();
    this.loadCurrentSubscriptionState();
    this.loadCurrentUserProfile();

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const stripeStatus = params.get('stripe');
        const redirectFlowId = params.get('redirect_flow_id');
        const requestedPlanId = params.get('plan');
        const requestedBillingCycle = params.get('billing');

        this.applyRequestedPlanSelection(requestedPlanId, requestedBillingCycle);

        if (stripeStatus === 'success') {
          this.setStatus('success', 'Stripe redirected back successfully. Your card setup or subscription update has completed.');
          this.loadCurrentSubscriptionState();
        } else if (stripeStatus === 'cancelled') {
          this.setStatus('info', 'Stripe checkout was cancelled. You can review the billing details and try again.');
        }

        if (redirectFlowId) {
          this.goCardlessForm.redirectFlowId = redirectFlowId;
          const storedSessionToken = sessionStorage.getItem(this.goCardlessSessionStorageKey) || '';
          if (storedSessionToken) {
            this.goCardlessForm.sessionToken = storedSessionToken;
            this.completeGoCardlessRedirectFlow();
          } else {
            this.setStatus('info', 'GoCardless returned a redirect flow id. Restore the session token to complete the mandate setup.');
          }
        }

        this.syncCheckoutUrls();
        this.refreshProviderViewState();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setBillingCycle(cycle: 'monthly' | 'yearly'): void {
    this.billingCycle = cycle;
    this.applyCatalogSelection();
    this.syncProviderSelection();
    this.syncCheckoutUrls();
    if (this.selectedPlan) {
      this.replaceCheckoutQueryParams();
      this.setStatus('info', `${this.selectedPlan.name} updated to ${cycle} billing.`);
    }

    this.refreshProviderViewState();
  }

  choosePlan(plan: PricingPlan): void {
    this.preparePaidPlanSelection(plan);
    this.replaceCheckoutQueryParams();
  }

  trackByPlanId(_index: number, plan: PricingPlan): string {
    return plan.id;
  }

  selectProvider(provider: 'stripe' | 'gocardless'): void {
    if (!this.isProviderSelectable(provider)) {
      this.setStatus('info', this.getProviderUnavailableReason(provider));
      return;
    }

    this.manualProviderSelection = true;
    this.selectedProvider = provider;

    if (provider === 'stripe') {
      const disabledReason = this.getStripeCheckoutDisabledReason();
      if (disabledReason) {
        this.setStatus('info', disabledReason);
        return;
      }

      this.setStatus(
        'info',
        this.hasStripePublishableKeyFallback()
          ? 'Stripe is ready. This environment is using the Stripe fallback publishable key for hosted checkout.'
          : 'Stripe is ready. Enter a valid billing email and continue to secure card checkout.',
      );
      return;
    }

    this.setStatus('info', 'GoCardless is selected. Enter billing details to continue to the debit mandate flow.');
  }

  continueWithSelectedProvider(): void {
    this.checkoutAttempted = true;

    if (!this.selectedPlan) {
      this.setStatus('error', 'Choose a plan before continuing to checkout.');
      return;
    }

    if (!this.validateBillingDetails()) {
      return;
    }

    this.applyBillingContact(this.currentSubscription?.billingContact);
    this.applyBillingContact(this.getBillingContactFromUser(this.currentUser), { preferIncoming: true });
    this.syncProviderBillingFields();

    if (this.selectedProvider === 'stripe') {
      this.startStripePlanFlow();
      return;
    }

    this.startGoCardlessPlanFlow();
  }

  openBillingPortal(): void {
    if (!this.stripeForm.customerId) {
      this.setStatus('error', 'A Stripe customer id is required before opening the billing portal.');
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

  goBackToPricing(): void {
    this.router.navigate([environment.routes.pricingPlans], {
      queryParams: this.selectedPlan ? { plan: this.selectedPlan.id, billing: this.billingCycle } : undefined,
    });
  }

  get selectedPlanAmount(): number {
    if (!this.selectedPlan || this.selectedPlan.id === 'enterprise') {
      return 0;
    }

    return this.billingCycle === 'yearly'
      ? (this.selectedPlan.yearlyPrice ?? 0)
      : (this.selectedPlan.monthlyPrice ?? 0);
  }

  get billingPeriodLabel(): string {
    return this.billingCycle === 'yearly' ? 'year' : 'month';
  }

  get planSummaryLabel(): string {
    return this.selectedPlan?.name || 'No plan selected';
  }

  get checkoutProgressStep(): number {
    if (!this.selectedPlan) {
      return 1;
    }

    if (!this.isBillingContactComplete() || !this.isValidEmail(this.billingForm.email)) {
      return 2;
    }

    return this.busy ? 3 : 2;
  }

  get selectedPlanPriceSummary(): string {
    if (!this.selectedPlan) {
      return 'Select a plan to see pricing';
    }

    return `$${this.selectedPlanAmount} / ${this.billingPeriodLabel}`;
  }

  get selectedProviderSupportCopy(): string {
    return this.providerViewState[this.selectedProvider]?.supportCopy || '';
  }

  get statusTitle(): string {
    if (this.busy && this.busyAction) {
      return this.busyAction;
    }

    if (this.statusTone === 'success') {
      return 'Ready';
    }

    if (this.statusTone === 'error') {
      return 'Action needed';
    }

    return 'Next step';
  }

  get selectedProviderLabel(): string {
    return this.selectedProvider === 'stripe' ? 'Stripe' : 'GoCardless';
  }

  get selectedProviderJourneyTitle(): string {
    return this.selectedProvider === 'stripe'
      ? 'Hosted card checkout'
      : 'Direct debit mandate setup';
  }

  get selectedProviderJourneyCopy(): string {
    if (this.selectedProvider === 'stripe') {
      return 'You will be redirected to Stripe Checkout to securely save a card and confirm the selected recurring plan.';
    }

    return 'You will be redirected to GoCardless to authorize a debit mandate, then the recurring subscription will be created for the selected plan.';
  }

  get selectedProviderContactSummary(): string {
    const fullName = this.getBillingFullName();
    return fullName && this.billingForm.email
      ? `${fullName} • ${this.billingForm.email}`
      : fullName || this.billingForm.email || 'Add billing contact details';
  }

  get selectedProviderEnvironmentLabel(): string {
    if (this.selectedProvider === 'stripe') {
      return this.hasStripePublishableKeyFallback()
        ? 'Test fallback key in use'
        : 'Hosted secure checkout';
    }

    return this.goCardlessConfig?.environment === 'live'
      ? 'Live mandate flow'
      : 'Sandbox mandate flow';
  }

  getStripeCtaLabel(): string {
    return 'Save card and activate subscription';
  }

  getPrimaryActionLabel(): string {
    return this.selectedProvider === 'stripe'
      ? this.getStripeCtaLabel()
      : 'Continue to GoCardless';
  }

  getBillingFullName(): string {
    return [this.billingForm.givenName, this.billingForm.familyName]
      .map((value) => String(value || '').trim())
      .filter((value) => !!value)
      .join(' ');
  }

  isProviderSelectableForView(provider: PaymentProvider): boolean {
    return this.isProviderSelectable(provider);
  }

  hasStripeReferenceData(): boolean {
    return !!(this.stripeForm.customerId || this.stripeForm.subscriptionId);
  }

  hasGoCardlessReferenceData(): boolean {
    return !!(this.goCardlessForm.mandateId || this.goCardlessForm.subscriptionId || this.goCardlessForm.redirectFlowId);
  }

  getProviderStateLabel(provider: PaymentProvider): string {
    if (!this.providerAvailability[provider]) {
      return provider === 'stripe' ? 'Setup needed' : 'Unavailable';
    }

    if (provider === 'stripe' && !this.hasConfiguredStripePrice()) {
      return 'No plan price';
    }

    return 'Ready';
  }

  getProviderBadge(provider: PaymentProvider): string {
    return provider === 'stripe' ? 'Cards and wallets' : 'Bank debit';
  }

  getProviderSupportCopy(provider: PaymentProvider): string {
    if (provider === 'stripe') {
      if (!this.providerAvailability.stripe) {
        return 'Hosted Stripe checkout will unlock as soon as the backend Stripe secret is configured for this environment.';
      }

      if (!this.hasConfiguredStripePrice()) {
        return 'This plan needs a Stripe price id in the catalog before card checkout can start.';
      }

      return this.hasStripePublishableKeyFallback()
        ? 'Stripe checkout is enabled. This environment is using the backend fallback publishable key.'
        : 'Stripe checkout is enabled and ready for card-based recurring billing.';
    }

    if (!this.providerAvailability.gocardless) {
      return 'GoCardless is not configured for this environment yet.';
    }

    return 'Recurring direct debit mandate flow for secure bank account billing.';
  }

  getProviderUnavailableReason(provider: PaymentProvider): string {
    if (!this.selectedPlan) {
      return 'Select a subscription plan before choosing a payment provider.';
    }

    if (!this.providerAvailability[provider]) {
      return provider === 'stripe'
        ? 'Stripe is not configured in the current environment.'
        : 'GoCardless is not configured in the current environment.';
    }

    if (provider === 'stripe' && !this.hasConfiguredStripePrice()) {
      return `${this.planSummaryLabel} on ${this.billingCycle} billing does not have a Stripe price configured yet.`;
    }

    return '';
  }

  isStripeCheckoutDisabled(): boolean {
    return !!this.getStripeCheckoutDisabledReason();
  }

  getStripeCheckoutDisabledReason(): string {
    if (this.busy) {
      return `${this.busyAction || 'Checkout'} is already in progress.`;
    }

    if (!this.selectedPlan) {
      return 'Select a subscription plan before starting Stripe checkout.';
    }

    if (!this.hasConfiguredStripePrice()) {
      return `${this.planSummaryLabel} on ${this.billingCycle} billing cannot start Stripe checkout yet because no Stripe price is configured in the backend catalog for this plan.`;
    }

    return '';
  }

  hasStripePublishableKeyFallback(): boolean {
    return !!this.providerAvailability.stripe && !this.paymentCatalog?.providers?.stripe?.publishableKeyConfigured;
  }

  isBillingPortalDisabled(): boolean {
    return !!this.getBillingPortalDisabledReason();
  }

  getBillingPortalDisabledReason(): string {
    if (this.busy) {
      return `${this.busyAction || 'Checkout'} is already in progress.`;
    }

    if (!this.stripeForm.customerId) {
      return 'Billing portal becomes available after a Stripe customer or subscription has been created for this account.';
    }

    return '';
  }

  hasConfiguredStripePrice(): boolean {
    const selectedBillingOption = this.getSelectedBillingOption();
    return !!selectedBillingOption?.configured && !!selectedBillingOption?.stripePriceId;
  }

  getResolvedStripePriceId(): string {
    return this.getSelectedBillingOption()?.stripePriceId || '';
  }

  hasStoredBillingContact(): boolean {
    const billingContact = this.currentSubscription?.billingContact;
    return !!billingContact && Object.values(billingContact).some((value) => !!String(value || '').trim());
  }

  getStoredBillingContactLabel(): string {
    const billingContact = this.currentSubscription?.billingContact;
    if (!billingContact) {
      return 'No billing contact stored yet';
    }

    return billingContact.fullName
      || [billingContact.givenName, billingContact.familyName].filter((value) => !!String(value || '').trim()).join(' ')
      || billingContact.email
      || 'No billing contact stored yet';
  }

  shouldShowEmailError(email: string | null | undefined, reveal: boolean): boolean {
    if (!reveal) {
      return false;
    }

    return !this.isValidEmail(email);
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
      formatted = digits.slice(0, 2) + ' / ' + digits.slice(2);
    } else if (digits.length === 2 && !rawValue.includes('/')) {
      formatted = digits + ' / ';
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

  isContinueDisabled(): boolean {
    return !!this.getContinueDisabledReason();
  }

  getContinueDisabledReason(): string {
    if (this.busy) {
      return `${this.busyAction || 'Checkout'} is already in progress.`;
    }

    if (!this.selectedPlan) {
      return 'Select a subscription plan before continuing.';
    }

    const billingValidationMessage = this.getBillingValidationMessage();
    if (billingValidationMessage) {
      return billingValidationMessage;
    }

    if (this.selectedProvider === 'stripe') {
      return this.getStripeCheckoutDisabledReason();
    }

    if (!this.providerAvailability.gocardless) {
      return 'GoCardless is not configured in the current environment.';
    }

    return '';
  }

  private loadProviderConfigs(): void {
    this.stripeSubscriptionsService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.stripeConfig = config;
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
        error: () => {
          this.stripeConfig = {
            provider: 'stripe',
            publishableKey: this.stripeSubscriptionsService.publishableKey,
          };
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
      });

    this.goCardlessSubscriptionsService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.goCardlessConfig = config;
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
        error: () => {
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
      });
  }

  private loadPaymentsCatalog(): void {
    this.paymentsStateService.getCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (catalog) => {
          this.paymentCatalog = catalog;
          this.providerAvailability = {
            stripe: !!catalog.providers?.stripe?.configured,
            gocardless: !!catalog.providers?.gocardless?.configured,
          };
          this.applyCatalogSelection();
          this.syncProviderSelection();
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
        error: () => {
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
      });
  }

  private loadCurrentSubscriptionState(): void {
    this.paymentsStateService.getSubscriptionState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ subscription }) => {
          this.currentSubscription = subscription;
          this.applyPersistedSubscription(subscription);
          this.syncProviderSelection(this.shouldUseSubscriptionProviderPreference() ? subscription?.provider : undefined);
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
        error: () => {
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
      });
  }

  private loadCurrentUserProfile(): void {
    const userId = this.usersService.getCurrentUserID();
    if (!userId) {
      return;
    }

    this.usersService.getByIdAsync(userId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.applyBillingContact(this.getBillingContactFromUser(user), { preferIncoming: true });
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
        error: () => {
          this.refreshProviderViewState();
          this.cdr.markForCheck();
        },
      });
  }

  private applyRequestedPlanSelection(planId: string | null, billingCycle: string | null): void {
    if (billingCycle === 'monthly' || billingCycle === 'yearly') {
      this.billingCycle = billingCycle;
    }

    const matchedPlan = this.pricingPlans.find((plan) => plan.id === planId);
    if (!matchedPlan) {
      if (!this.selectedPlan) {
        this.router.navigate([environment.routes.pricingPlans]);
      }
      return;
    }

    this.preparePaidPlanSelection(matchedPlan, false);
  }

  private preparePaidPlanSelection(plan: PricingPlan, announce = true): void {
    this.selectedPlan = plan;
    this.manualProviderSelection = false;
    this.goCardlessForm.description = `EVRYKA ${plan.name} subscription`;
    this.applyCatalogSelection();
    this.syncProviderSelection();
    this.syncCheckoutUrls();

    if (announce) {
      if (this.selectedProvider === 'stripe' && this.getStripeCheckoutDisabledReason()) {
        this.setStatus('info', this.getStripeCheckoutDisabledReason());
      } else {
        this.setStatus('info', `${plan.name} selected on ${this.billingCycle} billing. Continue to the secure payment step to bind a card or debit mandate.`);
      }
    }
  }

  private startStripePlanFlow(): void {
    if (!this.hasConfiguredStripePrice()) {
      this.setStatus('error', 'Stripe price configuration is missing for the selected plan and billing cycle.');
      return;
    }

    if (!this.providerAvailability.stripe) {
      this.setStatus('error', 'Stripe is not configured in the current environment.');
      return;
    }

    this.syncProviderBillingFields();
    const billingEmail = this.normalizeEmail(this.billingForm.email || this.stripeForm.customerEmail || this.stripeForm.email);

    if (!billingEmail) {
      this.setStatus('error', 'A billing email is required before starting Stripe checkout.');
      return;
    }

    if (!this.isValidEmail(billingEmail)) {
      this.setStatus('error', 'Enter a valid billing email before starting Stripe checkout.');
      return;
    }

    this.stripeForm.email = billingEmail;
    this.stripeForm.customerEmail = billingEmail;

    this.runAction('Creating Stripe checkout session', () =>
      this.stripeSubscriptionsService.createCheckoutSession({
        priceId: this.getResolvedStripePriceId(),
        planId: this.selectedPlan?.id,
        billingCycle: this.billingCycle,
        successUrl: this.stripeForm.successUrl,
        cancelUrl: this.stripeForm.cancelUrl,
        customerId: this.stripeForm.customerId || undefined,
        customerEmail: this.stripeForm.customerId ? undefined : billingEmail,
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

  private startGoCardlessPlanFlow(): void {
    if (!this.providerAvailability.gocardless) {
      this.setStatus('error', 'GoCardless is not configured in the current environment.');
      return;
    }

    this.syncProviderBillingFields();
    const billingEmail = this.normalizeEmail(this.billingForm.email || this.goCardlessForm.email);

    if (!this.billingForm.email || !this.billingForm.givenName || !this.billingForm.familyName) {
      this.setStatus('error', 'Billing first name, last name, and email are required before starting GoCardless setup.');
      return;
    }

    if (!this.isValidEmail(billingEmail)) {
      this.setStatus('error', 'Enter a valid billing email before starting GoCardless setup.');
      return;
    }

    this.goCardlessForm.email = billingEmail;

    if (this.goCardlessForm.mandateId && !this.goCardlessForm.subscriptionId) {
      this.createGoCardlessSubscription();
      return;
    }

    this.goCardlessForm.sessionToken = this.goCardlessForm.sessionToken || this.createSessionToken();
    sessionStorage.setItem(this.goCardlessSessionStorageKey, this.goCardlessForm.sessionToken);

    this.runAction('Creating GoCardless mandate flow', () =>
      this.goCardlessSubscriptionsService.createRedirectFlow({
        description: this.goCardlessForm.description,
        sessionToken: this.goCardlessForm.sessionToken,
        successRedirectUrl: this.goCardlessForm.successRedirectUrl,
        prefilledCustomer: {
          email: billingEmail,
          givenName: this.billingForm.givenName,
          familyName: this.billingForm.familyName,
        },
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.goCardlessForm.redirectFlowId = response.redirect_flows.id;
          this.setStatus('success', 'Redirecting to GoCardless mandate setup.');
          globalThis.location.href = response.redirect_flows.redirect_url;
        },
        error: (error) => this.handleActionError('Creating GoCardless mandate flow', error),
      })
    );
  }

  private completeGoCardlessRedirectFlow(): void {
    if (!this.goCardlessForm.redirectFlowId || !this.goCardlessForm.sessionToken) {
      return;
    }

    this.runAction('Completing GoCardless redirect flow', () =>
      this.goCardlessSubscriptionsService.completeRedirectFlow({
        redirectFlowId: this.goCardlessForm.redirectFlowId,
        sessionToken: this.goCardlessForm.sessionToken,
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.goCardlessForm.mandateId = response.redirect_flows.links?.mandate || this.goCardlessForm.mandateId;
          this.loadCurrentSubscriptionState();
          this.setStatus('success', `GoCardless mandate ready${this.goCardlessForm.mandateId ? `: ${this.goCardlessForm.mandateId}` : ''}. Continue to create the subscription.`);
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Completing GoCardless redirect flow', error),
      })
    );
  }

  private createGoCardlessSubscription(): void {
    if (!this.goCardlessForm.mandateId) {
      this.setStatus('error', 'A GoCardless mandate is required before creating the subscription.');
      return;
    }

    const amount = this.selectedPlanAmount ? Math.round(this.selectedPlanAmount * 100) : 0;
    if (!amount) {
      this.setStatus('error', 'Select a paid plan before creating a GoCardless subscription.');
      return;
    }

    this.runAction('Creating GoCardless subscription', () =>
      this.goCardlessSubscriptionsService.createSubscription({
        mandateId: this.goCardlessForm.mandateId,
        amount,
        currency: this.goCardlessForm.currency,
        planId: this.selectedPlan?.id,
        billingCycle: this.billingCycle,
        name: this.selectedPlan ? `EVRYKA ${this.selectedPlan.name}` : 'EVRYKA Subscription',
        interval: 1,
        intervalUnit: this.billingCycle === 'yearly' ? 'yearly' : 'monthly',
        metadata: this.getPlanMetadata(),
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.goCardlessForm.subscriptionId = response.subscriptions.id;
          this.loadCurrentSubscriptionState();
          this.setStatus('success', `GoCardless subscription created: ${response.subscriptions.id}`);
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Creating GoCardless subscription', error),
      })
    );
  }

  private applyPersistedSubscription(subscription: PaymentSubscriptionState | null): void {
    if (!subscription) {
      this.applyCatalogSelection();
      this.syncProviderSelection();
      return;
    }

    if (!this.selectedPlan && subscription.planId) {
      const matchedPlan = this.pricingPlans.find((plan) => plan.id === subscription.planId);
      if (matchedPlan) {
        this.selectedPlan = matchedPlan;
      }
    }

    if (subscription.billingCycle && !this.route.snapshot.queryParamMap.get('billing')) {
      this.billingCycle = subscription.billingCycle;
    }

    this.stripeForm.customerId = subscription.customerId || this.stripeForm.customerId;
    this.stripeForm.subscriptionId = subscription.subscriptionId || this.stripeForm.subscriptionId;
    this.goCardlessForm.subscriptionId = subscription.subscriptionId || this.goCardlessForm.subscriptionId;
    this.goCardlessForm.mandateId = subscription.mandateId || this.goCardlessForm.mandateId;
    this.goCardlessForm.redirectFlowId = subscription.redirectFlowId || this.goCardlessForm.redirectFlowId;
    this.applyBillingContact(subscription.billingContact);
    this.applyCatalogSelection();
    this.syncCheckoutUrls();
  }

  private applyCatalogSelection(): void {
    this.stripeForm.priceId = this.getResolvedStripePriceId();
    this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
    this.refreshProviderViewState();
  }

  private getPreferredProvider(planId: string): 'stripe' | 'gocardless' | undefined {
    return this.paymentCatalog?.plans.find((plan) => plan.id === planId)?.preferredProvider;
  }

  private getSelectedCatalogPlan(): PaymentCatalogPlan | undefined {
    return this.paymentCatalog?.plans.find((plan) => plan.id === this.selectedPlan?.id);
  }

  private getSelectedBillingOption() {
    const selectedCatalogPlan = this.getSelectedCatalogPlan();
    if (!selectedCatalogPlan) {
      return undefined;
    }

    return this.billingCycle === 'yearly'
      ? selectedCatalogPlan.yearly
      : selectedCatalogPlan.monthly;
  }

  private applyBillingContact(
    billingContact?: PaymentBillingContact,
    options?: { preferIncoming?: boolean },
  ): void {
    if (!billingContact) {
      return;
    }

    const preferIncoming = !!options?.preferIncoming;
    const resolvedName = this.resolveBillingNameParts(billingContact);

    this.billingForm.email = this.mergeBillingValue(this.billingForm.email, billingContact.email, preferIncoming);
    this.billingForm.givenName = this.mergeBillingValue(this.billingForm.givenName, resolvedName.givenName, preferIncoming);
    this.billingForm.familyName = this.mergeBillingValue(this.billingForm.familyName, resolvedName.familyName, preferIncoming);
    this.syncProviderBillingFields();
  }

  private getBillingContactFromUser(user?: User): PaymentBillingContact | undefined {
    if (!user) {
      return undefined;
    }

    const fullName = [user.firstname, user.lastname].filter((value) => !!String(value || '').trim()).join(' ');
    return {
      email: user.email,
      fullName: fullName || undefined,
      givenName: user.firstname || undefined,
      familyName: user.lastname || undefined,
      phone: user.phone || undefined,
    };
  }

  private getBillingContactFromSession(): PaymentBillingContact | undefined {
    const userId = sessionStorage.getItem(environment.storage.userId);
    const token = (userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) : null)
      || sessionStorage.getItem(environment.storage.token)
      || '';
    const decodedToken = this.authService.decodeJWTToken(token);
    const tokenUser = decodedToken?.user ?? {};
    const sessionUser = this.getStoredCurrentUser();

    const givenName = this.getFirstNonEmptyValue(
      tokenUser?.firstname,
      tokenUser?.firstName,
      sessionUser?.['firstname'],
      sessionUser?.['firstName'],
    );
    const familyName = this.getFirstNonEmptyValue(
      tokenUser?.lastname,
      tokenUser?.lastName,
      sessionUser?.['lastname'],
      sessionUser?.['lastName'],
    );
    const fullName = this.getFirstNonEmptyValue(
      tokenUser?.fullName,
      tokenUser?.displayName,
      sessionUser?.['fullName'],
      sessionUser?.['displayName'],
    );
    const email = this.getFirstNonEmptyValue(
      tokenUser?.email,
      sessionUser?.['email'],
    );

    if (!email && !givenName && !familyName && !fullName) {
      return undefined;
    }

    return {
      email: email || undefined,
      givenName: givenName || undefined,
      familyName: familyName || undefined,
      fullName: fullName || undefined,
    };
  }

  private getPlanMetadata() {
    return this.selectedPlan
      ? {
        planId: this.selectedPlan.id,
        planName: this.selectedPlan.name,
        billingCycle: this.billingCycle,
        cardholderName: this.cardForm.cardholderName,
      }
      : undefined;
  }

  private validateBillingDetails(): boolean {
    if (!this.billingForm.email || !this.billingForm.givenName || !this.billingForm.familyName) {
      this.setStatus('error', 'Fill in the billing email, name, and surname fields before continuing.');
      return false;
    }

    if (!this.isValidEmail(this.billingForm.email)) {
      this.setStatus('error', 'Enter a valid billing email before continuing to checkout.');
      return false;
    }

    return true;
  }

  private isBillingContactComplete(): boolean {
    return !!this.billingForm.email && !!this.billingForm.givenName && !!this.billingForm.familyName;
  }

  private getBillingValidationMessage(): string {
    if (!this.isBillingContactComplete()) {
      return 'Fill in the billing email, name, and surname fields before continuing.';
    }

    if (!this.isValidEmail(this.billingForm.email)) {
      return 'Enter a valid billing email before continuing to checkout.';
    }

    return '';
  }

  private syncProviderBillingFields(): void {
    const cardholderName = this.cardForm.cardholderName.trim();
    const fullName = cardholderName || this.getBillingFullName();

    this.stripeForm.email = this.billingForm.email;
    this.stripeForm.customerEmail = this.billingForm.email;
    this.stripeForm.name = fullName;
    this.goCardlessForm.email = this.billingForm.email;
    this.goCardlessForm.givenName = this.billingForm.givenName;
    this.goCardlessForm.familyName = this.billingForm.familyName;

    if (!this.gcCardForm.cardholderName) {
      this.gcCardForm.cardholderName = fullName;
    }
  }

  private runAction(action: string, work: () => void): void {
    this.busy = true;
    this.busyAction = action;
    this.setStatus('info', `${action}...`);
    work();
  }

  private handleActionError(action: string, error: unknown): void {
    const resolvedError = error as { error?: { message?: string }; message?: string };
    const message = resolvedError.error?.message || resolvedError.message || 'Unexpected error.';
    this.busy = false;
    this.busyAction = '';
    this.setStatus('error', `${action} failed: ${message}`);
    this.cdr.markForCheck();
  }

  private setStatus(tone: 'info' | 'success' | 'error', message: string): void {
    this.statusTone = tone;
    this.statusMessage = message;
    if (tone !== 'info') {
      this.busy = false;
      this.busyAction = '';
    }
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
    const baseUrl = this.getCheckoutPageUrl();
    const params = this.getCheckoutQueryParams();
    const queryString = new URLSearchParams(params).toString();
    const checkoutUrlKey = `${baseUrl}?${queryString}`;

    if (checkoutUrlKey === this.lastCheckoutUrlKey) {
      return;
    }

    this.lastCheckoutUrlKey = checkoutUrlKey;
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    this.stripeForm.successUrl = `${fullUrl}${queryString ? '&' : '?'}stripe=success`;
    this.stripeForm.cancelUrl = `${fullUrl}${queryString ? '&' : '?'}stripe=cancelled`;
    this.stripeForm.returnUrl = fullUrl;
    this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
  }

  private getCheckoutPageUrl(): string {
    const origin = globalThis.location?.origin || environment.baseUrl.replace(/\/+$/, '');
    return `${origin}/${environment.routes.pricingPlans}/checkout`;
  }

  private syncProviderSelection(preferredProvider?: PaymentProvider): void {
    const availableProviders = this.getAvailableProvidersForSelection();
    if (!availableProviders.length) {
      return;
    }

    if (this.manualProviderSelection && availableProviders.includes(this.selectedProvider)) {
      return;
    }

    const requestedProvider = this.route.snapshot.queryParamMap.get('provider');
    const prioritizedProviders = [
      requestedProvider === 'stripe' || requestedProvider === 'gocardless' ? requestedProvider : undefined,
      preferredProvider,
      this.getPreferredProvider(this.selectedPlan?.id || ''),
      this.selectedProvider,
      ...availableProviders,
    ].filter((provider, index, values): provider is PaymentProvider => !!provider && values.indexOf(provider) === index);

    this.selectedProvider = prioritizedProviders.find((provider) => availableProviders.includes(provider)) || availableProviders[0];
    this.refreshProviderViewState();
  }

  private refreshProviderViewState(): void {
    this.providerViewState = {
      stripe: this.buildProviderViewState('stripe'),
      gocardless: this.buildProviderViewState('gocardless'),
    };
  }

  private buildProviderViewState(provider: PaymentProvider): CheckoutProviderViewState {
    const stateLabel = this.getProviderStateLabel(provider);

    return {
      selectable: this.isProviderSelectable(provider),
      unavailableReason: this.getProviderUnavailableReason(provider),
      badge: this.getProviderBadge(provider),
      stateLabel,
      supportCopy: this.getProviderSupportCopy(provider),
      ready: stateLabel === 'Ready',
    };
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
    if (!this.selectedPlan || this.selectedPlan.id === 'enterprise') {
      return false;
    }

    if (!this.providerAvailability[provider]) {
      return false;
    }

    return provider === 'stripe'
      ? this.hasConfiguredStripePrice()
      : true;
  }

  private shouldUseSubscriptionProviderPreference(): boolean {
    return !this.manualProviderSelection && !this.route.snapshot.queryParamMap.get('provider');
  }

  private resolveBillingNameParts(billingContact: PaymentBillingContact): { givenName: string; familyName: string } {
    const givenName = String(billingContact.givenName || '').trim();
    const familyName = String(billingContact.familyName || '').trim();

    if (givenName || familyName) {
      return { givenName, familyName };
    }

    const fullName = String(billingContact.fullName || '').trim();
    if (!fullName) {
      return { givenName: '', familyName: '' };
    }

    const [resolvedGivenName, ...rest] = fullName.split(/\s+/);
    return {
      givenName: resolvedGivenName || '',
      familyName: rest.join(' '),
    };
  }

  private getStoredCurrentUser(): Record<string, any> | undefined {
    const rawCurrentUser = sessionStorage.getItem(environment.storage.currentUser);
    if (!rawCurrentUser) {
      return undefined;
    }

    try {
      return JSON.parse(rawCurrentUser) as Record<string, any>;
    } catch {
      return undefined;
    }
  }

  private getFirstNonEmptyValue(...values: Array<unknown>): string {
    for (const value of values) {
      const normalizedValue = String(value || '').trim();
      if (normalizedValue) {
        return normalizedValue;
      }
    }

    return '';
  }

  private mergeBillingValue(currentValue: string | null | undefined, nextValue: string | null | undefined, preferIncoming = false): string {
    const normalizedCurrentValue = String(currentValue || '').trim();
    const normalizedNextValue = String(nextValue || '').trim();

    if (!normalizedNextValue) {
      return normalizedCurrentValue;
    }

    return preferIncoming || !normalizedCurrentValue
      ? normalizedNextValue
      : normalizedCurrentValue;
  }

  private getCheckoutQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.selectedPlan?.id) {
      params['plan'] = this.selectedPlan.id;
    }
    params['billing'] = this.billingCycle;
    return params;
  }

  private buildGoCardlessSuccessRedirectUrl(): string {
    const params = new URLSearchParams({ provider: 'gocardless', ...this.getCheckoutQueryParams() });
    return `${this.getCheckoutPageUrl()}?${params.toString()}`;
  }

  private replaceCheckoutQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.getCheckoutQueryParams(),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private redirectToLogin(): void {
    const returnUrl = this.router.serializeUrl(this.router.createUrlTree([environment.routes.pricingPlans, 'checkout'], {
      queryParams: this.getCheckoutQueryParams(),
    }));

    this.router.navigate([environment.routes.auth.login], {
      queryParams: { returnUrl },
    });
  }

  private createSessionToken(): string {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private normalizeEmail(email: string | null | undefined): string {
    return String(email || '').trim();
  }

  private isValidEmail(email: string | null | undefined): boolean {
    return this.emailPattern.test(this.normalizeEmail(email));
  }
}