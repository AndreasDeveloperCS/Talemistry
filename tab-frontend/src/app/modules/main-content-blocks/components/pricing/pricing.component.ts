import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PRICING_PLANS, PricingPlan } from '../../models/pricing-plan.data';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import {
  GoCardlessPublicConfig,
  GoCardlessSubscriptionsService,
} from '../../../payments/services/gocardless-subscriptions.service';
import {
  StripePublicConfig,
  StripeSubscriptionsService,
} from '../../../payments/services/stripe-subscriptions.service';
import {
  PaymentBillingContact,
  PaymentCatalogPlan,
  PaymentProvider,
  PaymentSubscriptionState,
  PaymentsCatalogResponse,
  PaymentsStateService,
} from '../../../payments/services/payments-state.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../authentication/services/auth.service';
import { User } from '../../../users/models/user';
import { UsersService } from '../../../users/services/users.service';
import { AuthGuardService } from 'src/app/modules/authentication/guard/auth-guard.service';
import { FUNCTIONALBLOCK } from 'src/app/modules/permissions/models/functional-block-enum';

type PricingPlanCardViewModel = {
  plan: PricingPlan;
  amount: number;
  hasFixedPrice: boolean;
  periodLabel: string;
  annualEquivalent: number;
  yearlySavings: number;
  showYearlyMeta: boolean;
  showYearlyUpsell: boolean;
};

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingComponent implements OnInit, OnDestroy {
  private readonly subscriptionSandboxAllowedEmail = 'superadmin@evryka.org';
  isAdmin: boolean = false;
  pricingPlans: PricingPlan[] = PRICING_PLANS;
  visiblePricingPlanCards: PricingPlanCardViewModel[] = [];
  billingCycle: 'monthly' | 'yearly' = 'monthly';
  readonly yearlyDiscountPercent = 16.7;
  selectedPlan?: PricingPlan;
  currentUser?: User;
  selectedProvider: 'stripe' | 'gocardless' = 'stripe';
  busy = false;
  busyAction = '';
  statusTone: 'info' | 'success' | 'error' = 'info';
  statusMessage = 'Choose a plan to start subscription checkout. Billing contact and subscription status are restored here when you are signed in.';
  canViewSubscriptionSandbox = false;
  stripeConfig?: StripePublicConfig;
  goCardlessConfig?: GoCardlessPublicConfig;
  paymentCatalog?: PaymentsCatalogResponse;
  currentSubscription: PaymentSubscriptionState | null = null;
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
  private readonly destroy$ = new Subject<void>();
  private readonly goCardlessSessionStorageKey = 'evryka-gocardless-session-token';
  private resumeSubscriptionFromQuery = false;
  private currentUserProfileResolved = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private authGuardService: AuthGuardService,
    private stripeSubscriptionsService: StripeSubscriptionsService,
    private goCardlessSubscriptionsService: GoCardlessSubscriptionsService,
    private paymentsStateService: PaymentsStateService,
    private usersService: UsersService,
  ) {
    this.isAdmin = this.authGuardService.userRoles.includes('SA');
    this.cdr.markForCheck();
    window.scrollTo(0, 0);
    const baseUrl = this.getPricingPageUrl();
    this.stripeForm.successUrl = `${baseUrl}?stripe=success`;
    this.stripeForm.cancelUrl = `${baseUrl}?stripe=cancelled`;
    this.stripeForm.returnUrl = baseUrl;
    this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
  }

  ngOnInit(): void {
    this.refreshPricingPlanCards();
    this.resolveSubscriptionSandboxAccess();
    if (this.canViewSubscriptionSandbox) {
      this.loadProviderConfigs();
      this.loadCurrentSubscriptionState();
    }
    this.loadPaymentsCatalog();
    this.loadCurrentUserProfile();

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const stripeStatus = params.get('stripe');
        const redirectFlowId = params.get('redirect_flow_id');
        const requestedPlanId = params.get('plan');
        const requestedBillingCycle = params.get('billing');

        this.resumeSubscriptionFromQuery = params.get('action') === 'subscribe';
        this.applyRequestedPlanSelection(requestedPlanId, requestedBillingCycle);

        if (stripeStatus === 'success') {
          this.setStatus('success', 'Stripe redirected back successfully. You can now fetch the subscription status or open the billing portal.');
          this.loadCurrentSubscriptionState();
        } else if (stripeStatus === 'cancelled') {
          this.setStatus('info', 'Stripe checkout was cancelled. You can adjust the plan and retry.');
        }

        if (redirectFlowId) {
          this.goCardlessForm.redirectFlowId = redirectFlowId;
          const storedSessionToken = sessionStorage.getItem(this.goCardlessSessionStorageKey) || '';
          if (storedSessionToken) {
            this.goCardlessForm.sessionToken = storedSessionToken;
            this.completeGoCardlessRedirectFlow();
          } else {
            this.setStatus('info', 'GoCardless returned a redirect flow id. Paste or restore the session token to complete the mandate setup.');
          }
        }

        this.maybeResumeRequestedSubscription(stripeStatus, redirectFlowId);

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectPlan(plan: PricingPlan): void {
    // Enterprise always goes to contact sales
    if (plan.id === 'enterprise') {
      this.onContactSales();
      return;
    }

    // Navigate to the subscription page with plan and billing info
    this.navigateToSubscriptionPage(plan);
  }

  onContactSales(): void {
    this.router.navigate([environment.routes.contactUs], {
      queryParams: {
        subject: 'Enterprise Plan Inquiry',
        source: 'pricing-page'
      }
    });
  }

  private navigateToSubscriptionPage(plan: PricingPlan): void {
    this.router.navigate([environment.routes.subscription], {
      queryParams: {
        plan: plan.id,
        billing: this.billingCycle,
      },
    });
  }

  createStripeCustomer(): void {
    if (!this.stripeForm.email) {
      this.setStatus('error', 'Stripe customer creation requires an email address.');
      return;
    }

    this.runAction('Creating Stripe customer', () =>
      this.stripeSubscriptionsService.createCustomer({
        email: this.stripeForm.email,
        name: this.stripeForm.name || undefined,
        description: this.selectedPlan ? `${this.selectedPlan.name} customer` : undefined,
        metadata: this.getPlanMetadata(),
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.stripeForm.customerId = response.id;
          this.stripeForm.customerEmail = response.email || this.stripeForm.email;
          this.loadCurrentSubscriptionState();
          this.setStatus('success', `Stripe customer created: ${response.id}`);
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Creating Stripe customer', error),
      })
    );
  }

  startStripeCheckout(): void {
    const resolvedPriceId = this.getResolvedStripePriceId();
    if (!resolvedPriceId) {
      this.setStatus('error', 'No Stripe price id is configured on the backend for this plan and billing cycle.');
      this.scrollToSubscriptionPanel();
      return;
    }

    this.runAction('Creating Stripe checkout session', () =>
      this.stripeSubscriptionsService.createCheckoutSession({
        priceId: resolvedPriceId,
        planId: this.selectedPlan?.id,
        billingCycle: this.billingCycle,
        successUrl: this.stripeForm.successUrl,
        cancelUrl: this.stripeForm.cancelUrl,
        customerId: this.stripeForm.customerId || undefined,
        customerEmail: this.stripeForm.customerEmail || this.stripeForm.email || undefined,
        metadata: this.getPlanMetadata(),
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          if (response.url) {
            this.setStatus('success', 'Redirecting to Stripe checkout.');
            globalThis.location.href = response.url;
            return;
          }

          this.loadCurrentSubscriptionState();
          this.setStatus('info', `Stripe checkout session created: ${response.id}`);
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Creating Stripe checkout session', error),
      })
    );
  }

  openStripeBillingPortal(): void {
    if (!this.stripeForm.customerId) {
      this.setStatus('error', 'Provide a Stripe customer id before opening the billing portal.');
      return;
    }

    this.runAction('Creating Stripe billing portal session', () =>
      this.stripeSubscriptionsService.createBillingPortalSession({
        customerId: this.stripeForm.customerId,
        returnUrl: this.stripeForm.returnUrl,
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.setStatus('success', 'Redirecting to Stripe billing portal.');
          globalThis.location.href = response.url;
        },
        error: (error) => this.handleActionError('Creating Stripe billing portal session', error),
      })
    );
  }

  fetchStripeSubscription(): void {
    if (!this.stripeForm.subscriptionId) {
      this.setStatus('error', 'Provide a Stripe subscription id to fetch status.');
      return;
    }

    this.runAction('Loading Stripe subscription', () =>
      this.stripeSubscriptionsService.getSubscription(this.stripeForm.subscriptionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.setStatus('success', `Stripe subscription ${response.id} is ${response.status}.`);
            this.cdr.markForCheck();
          },
          error: (error) => this.handleActionError('Loading Stripe subscription', error),
        })
    );
  }

  cancelStripeSubscription(): void {
    if (!this.stripeForm.subscriptionId) {
      this.setStatus('error', 'Provide a Stripe subscription id before cancelling.');
      return;
    }

    this.runAction('Cancelling Stripe subscription', () =>
      this.stripeSubscriptionsService.cancelSubscription(this.stripeForm.subscriptionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loadCurrentSubscriptionState();
            this.setStatus('success', `Stripe subscription ${response.id} updated to ${response.status}.`);
            this.cdr.markForCheck();
          },
          error: (error) => this.handleActionError('Cancelling Stripe subscription', error),
        })
    );
  }

  startGoCardlessRedirectFlow(): void {
    if (!this.goCardlessForm.email || !this.goCardlessForm.givenName || !this.goCardlessForm.familyName) {
      this.setStatus('error', 'GoCardless redirect setup requires email, first name, and last name.');
      this.scrollToSubscriptionPanel();
      return;
    }

    this.goCardlessForm.sessionToken = this.goCardlessForm.sessionToken || this.createSessionToken();
    this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
    sessionStorage.setItem(this.goCardlessSessionStorageKey, this.goCardlessForm.sessionToken);

    this.runAction('Creating GoCardless redirect flow', () =>
      this.goCardlessSubscriptionsService.createRedirectFlow({
        description: this.goCardlessForm.description,
        sessionToken: this.goCardlessForm.sessionToken,
        successRedirectUrl: this.goCardlessForm.successRedirectUrl,
        prefilledCustomer: {
          email: this.goCardlessForm.email,
          givenName: this.goCardlessForm.givenName,
          familyName: this.goCardlessForm.familyName,
        },
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.goCardlessForm.redirectFlowId = response.redirect_flows.id;
          this.setStatus('success', 'Redirecting to GoCardless mandate setup.');
          globalThis.location.href = response.redirect_flows.redirect_url;
        },
        error: (error) => this.handleActionError('Creating GoCardless redirect flow', error),
      })
    );
  }

  completeGoCardlessRedirectFlow(): void {
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
          this.setStatus('success', `GoCardless mandate ready${this.goCardlessForm.mandateId ? `: ${this.goCardlessForm.mandateId}` : ''}.`);
          if (this.resumeSubscriptionFromQuery && this.selectedPlan && !this.goCardlessForm.subscriptionId) {
            this.resumeSubscriptionFromQuery = false;
            this.createGoCardlessSubscription();
            return;
          }
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Completing GoCardless redirect flow', error),
      })
    );
  }

  createGoCardlessSubscription(): void {
    if (!this.goCardlessForm.mandateId) {
      this.setStatus('error', 'Provide a GoCardless mandate id before creating a subscription.');
      return;
    }

    const amount = this.selectedPlan ? Math.round(this.getBillingAmount(this.selectedPlan) * 100) : 0;
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

  fetchGoCardlessSubscription(): void {
    if (!this.goCardlessForm.subscriptionId) {
      this.setStatus('error', 'Provide a GoCardless subscription id to fetch status.');
      return;
    }

    this.runAction('Loading GoCardless subscription', () =>
      this.goCardlessSubscriptionsService.getSubscription(this.goCardlessForm.subscriptionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.setStatus('success', `GoCardless subscription ${response.subscriptions.id} is ${response.subscriptions.status}.`);
            this.cdr.markForCheck();
          },
          error: (error) => this.handleActionError('Loading GoCardless subscription', error),
        })
    );
  }

  cancelGoCardlessSubscription(): void {
    if (!this.goCardlessForm.subscriptionId) {
      this.setStatus('error', 'Provide a GoCardless subscription id before cancelling.');
      return;
    }

    this.runAction('Cancelling GoCardless subscription', () =>
      this.goCardlessSubscriptionsService.cancelSubscription(this.goCardlessForm.subscriptionId, {
        metadata: this.getPlanMetadata(),
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadCurrentSubscriptionState();
          this.setStatus('success', `GoCardless subscription ${this.goCardlessForm.subscriptionId} cancellation submitted.`);
          this.cdr.markForCheck();
        },
        error: (error) => this.handleActionError('Cancelling GoCardless subscription', error),
      })
    );
  }

  private loadProviderConfigs(): void {
    this.stripeSubscriptionsService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.stripeConfig = config;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stripeConfig = {
            provider: 'stripe',
            publishableKey: this.stripeSubscriptionsService.publishableKey,
          };
          this.cdr.markForCheck();
        },
      });

    this.goCardlessSubscriptionsService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.goCardlessConfig = config;
          this.cdr.markForCheck();
        },
        error: () => {
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
          this.applyCatalogSelection();
          this.maybeResumeRequestedSubscription();
          this.cdr.markForCheck();
        },
        error: () => {
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
          this.maybeResumeRequestedSubscription();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  private loadCurrentUserProfile(): void {
    const userId = this.usersService.getCurrentUserID();
    if (!userId || !this.isAuthenticated()) {
      this.currentUserProfileResolved = true;
      this.maybeResumeRequestedSubscription();
      return;
    }

    this.usersService.getByIdAsync(userId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          const hadSandboxAccess = this.canViewSubscriptionSandbox;
          this.currentUser = user;
          this.resolveSubscriptionSandboxAccess(user.email);
          if (!hadSandboxAccess && this.canViewSubscriptionSandbox) {
            this.loadProviderConfigs();
            this.loadCurrentSubscriptionState();
          }
          this.applyBillingContact(this.getBillingContactFromUser(user));
          this.currentUserProfileResolved = true;
          this.maybeResumeRequestedSubscription();
          this.cdr.markForCheck();
        },
        error: () => {
          this.currentUserProfileResolved = true;
          this.maybeResumeRequestedSubscription();
          this.cdr.markForCheck();
        },
      });
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

  private getPlanMetadata() {
    return this.selectedPlan
      ? {
        planId: this.selectedPlan.id,
        planName: this.selectedPlan.name,
        billingCycle: this.billingCycle,
      }
      : undefined;
  }

  setBillingCycle(cycle: 'monthly' | 'yearly') {
    this.billingCycle = cycle;
    this.applyCatalogSelection();
    this.refreshPricingPlanCards();
    if (this.selectedPlan) {
      this.setStatus('info', `${this.selectedPlan.name} updated to ${cycle} billing.`);
    }
  }

  trackByPlanId(_index: number, planCard: PricingPlanCardViewModel): string {
    return planCard.plan.id;
  }

  getBillingAmount(plan: PricingPlan) {
    if (plan.id === 'enterprise') {
      return 0;
    }

    return this.billingCycle === 'yearly'
      ? (plan.yearlyPrice ?? 0)
      : (plan.monthlyPrice ?? 0);
  }

  getBillingPeriodLabel(plan: PricingPlan) {
    if (plan.id === 'enterprise') {
      return 'tailored';
    }

    return this.billingCycle === 'yearly' ? 'year' : 'month';
  }

  getAnnualEquivalent(plan: PricingPlan) {
    if (!plan.yearlyPrice) {
      return 0;
    }

    return Math.round((plan.yearlyPrice / 12) * 10) / 10;
  }

  getYearlySavings(plan: PricingPlan) {
    if (!plan.monthlyPrice || !plan.yearlyPrice) {
      return 0;
    }

    return (plan.monthlyPrice * 12) - plan.yearlyPrice;
  }

  isEnterprise(plan: PricingPlan) {
    return plan.id === 'enterprise';
  }

  hasFixedPrice(plan: PricingPlan) {
    return !this.isEnterprise(plan) && typeof plan.monthlyPrice === 'number';
  }

  getResolvedStripePriceId() {
    return this.getSelectedBillingOption()?.stripePriceId || '';
  }

  hasConfiguredStripePrice() {
    const selectedBillingOption = this.getSelectedBillingOption();
    return !!selectedBillingOption?.configured && !!selectedBillingOption?.stripePriceId;
  }

  get selectedProviderLabel() {
    return this.selectedProvider === 'stripe' ? 'Stripe' : 'GoCardless';
  }

  hasStripePublishableKeyFallback() {
    return !!this.isProviderConfigured('stripe') && !this.paymentCatalog?.providers?.stripe?.publishableKeyConfigured;
  }

  isProviderConfigured(provider: PaymentProvider) {
    return provider === 'stripe'
      ? !!this.paymentCatalog?.providers?.stripe?.configured
      : !!this.paymentCatalog?.providers?.gocardless?.configured;
  }

  getProviderStateLabel(provider: PaymentProvider) {
    if (!this.isProviderConfigured(provider)) {
      return provider === 'stripe' ? 'Setup needed' : 'Unavailable';
    }

    if (provider === 'stripe' && !this.hasConfiguredStripePrice()) {
      return 'No plan price';
    }

    return 'Ready';
  }

  getProviderSupportCopy(provider: PaymentProvider) {
    if (provider === 'stripe') {
      if (!this.isProviderConfigured('stripe')) {
        return 'Hosted Stripe checkout becomes available once the backend Stripe secret is configured.';
      }

      if (!this.hasConfiguredStripePrice()) {
        return 'This selected plan is missing a Stripe price id for the current billing cycle.';
      }

      return this.hasStripePublishableKeyFallback()
        ? 'Stripe checkout is enabled and currently using the backend fallback publishable key.'
        : 'Stripe checkout is enabled for hosted recurring card billing.';
    }

    if (!this.isProviderConfigured('gocardless')) {
      return 'GoCardless is not configured in this environment.';
    }

    return 'GoCardless is ready for direct debit mandate setup and recurring billing.';
  }

  getProviderBadge(provider: PaymentProvider) {
    return provider === 'stripe' ? 'Cards and wallets' : 'Bank debit';
  }

  getStripeCheckoutDisabledReason() {
    if (this.busy) {
      return `${this.busyAction || 'Checkout'} is already in progress.`;
    }

    if (!this.isProviderConfigured('stripe')) {
      return 'Stripe checkout is unavailable until the backend Stripe secret is configured.';
    }

    if (!this.hasConfiguredStripePrice()) {
      return 'No Stripe price id is configured on the backend for this plan and billing cycle.';
    }

    return '';
  }

  getCurrentSubscriptionPlanLabel() {
    return this.currentSubscription?.planName || this.currentSubscription?.planId || 'No active plan stored yet';
  }

  getCurrentSubscriptionCycleLabel() {
    return this.currentSubscription?.billingCycle || 'not set';
  }

  getCurrentSubscriptionStatusLabel() {
    return this.currentSubscription?.status || 'unknown';
  }

  hasStoredBillingContact() {
    const billingContact = this.currentSubscription?.billingContact;
    return !!billingContact && Object.values(billingContact).some((value) => !!String(value || '').trim());
  }

  getStoredBillingContactLabel() {
    const billingContact = this.currentSubscription?.billingContact;
    if (!billingContact) {
      return 'No billing contact stored yet';
    }

    return billingContact.fullName
      || [billingContact.givenName, billingContact.familyName].filter((value) => !!String(value || '').trim()).join(' ')
      || billingContact.email
      || 'No billing contact stored yet';
  }

  private createSessionToken() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private getPricingPageUrl() {
    const origin = globalThis.location?.origin || environment.baseUrl.replace(/\/+$/, '');
    return `${origin}/${environment.routes.pricingPlans}`;
  }

  private applyPersistedSubscription(subscription: PaymentSubscriptionState | null) {
    if (!subscription) {
      this.applyCatalogSelection();
      return;
    }

    if (subscription.planId) {
      const matchedPlan = this.pricingPlans.find((plan) => plan.id === subscription.planId);
      if (matchedPlan) {
        this.selectedPlan = matchedPlan;
      }
    }

    if (subscription.billingCycle) {
      this.billingCycle = subscription.billingCycle;
    }

    if (subscription.provider) {
      this.selectedProvider = subscription.provider;
    }

    this.stripeForm.customerId = subscription.customerId || this.stripeForm.customerId;
    this.stripeForm.subscriptionId = subscription.subscriptionId || this.stripeForm.subscriptionId;
    this.goCardlessForm.subscriptionId = subscription.subscriptionId || this.goCardlessForm.subscriptionId;
    this.goCardlessForm.mandateId = subscription.mandateId || this.goCardlessForm.mandateId;
    this.goCardlessForm.redirectFlowId = subscription.redirectFlowId || this.goCardlessForm.redirectFlowId;
    this.applyBillingContact(subscription.billingContact);
    this.applyCatalogSelection();
    this.refreshPricingPlanCards();
  }

  private applyCatalogSelection() {
    this.stripeForm.priceId = this.getResolvedStripePriceId();
    this.goCardlessForm.successRedirectUrl = this.buildGoCardlessSuccessRedirectUrl();
  }

  private getPreferredProvider(planId: string) {
    return this.paymentCatalog?.plans.find((plan) => plan.id === planId)?.preferredProvider;
  }

  private getSelectedCatalogPlan() {
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

  private preparePaidPlanSelection(plan: PricingPlan, announce = true) {
    this.selectedPlan = plan;
    this.selectedProvider = this.getPreferredProvider(plan.id) || (plan.id === 'starter' ? 'stripe' : 'gocardless');
    this.goCardlessForm.description = `EVRYKA ${plan.name} subscription`;
    this.applyCatalogSelection();

    if (announce) {
      this.setStatus('info', `${plan.name} selected on ${this.billingCycle} billing. ${this.selectedProvider === 'stripe' ? 'Stripe checkout will open directly if billing details are available.' : 'GoCardless mandate setup will start directly if billing details are available.'}`);
    }
  }

  private startSelectedPlanFlow() {
    if (!this.selectedPlan || this.isEnterprise(this.selectedPlan) || this.selectedPlan.id === 'freemium') {
      return;
    }

    this.applyBillingContact(this.currentSubscription?.billingContact);
    this.applyBillingContact(this.getBillingContactFromUser(this.currentUser));

    if (this.selectedProvider === 'stripe') {
      this.startStripePlanFlow();
      return;
    }

    this.startGoCardlessPlanFlow();
  }

  private startStripePlanFlow() {
    if (!this.hasConfiguredStripePrice()) {
      this.setStatus('error', 'Stripe price configuration is missing for the selected plan and billing cycle.');
      this.scrollToSubscriptionPanel();
      return;
    }

    if (!(this.stripeForm.customerEmail || this.stripeForm.email)) {
      this.setStatus('error', 'A billing email is required before starting Stripe checkout.');
      this.scrollToSubscriptionPanel();
      return;
    }

    this.startStripeCheckout();
  }

  private startGoCardlessPlanFlow() {
    if (!this.goCardlessForm.email || !this.goCardlessForm.givenName || !this.goCardlessForm.familyName) {
      this.setStatus('error', 'Billing first name, last name, and email are required before starting GoCardless setup.');
      this.scrollToSubscriptionPanel();
      return;
    }

    if (this.goCardlessForm.mandateId && !this.goCardlessForm.subscriptionId) {
      this.createGoCardlessSubscription();
      return;
    }

    this.startGoCardlessRedirectFlow();
  }

  private applyRequestedPlanSelection(planId: string | null, billingCycle: string | null) {
    if (billingCycle === 'monthly' || billingCycle === 'yearly') {
      this.billingCycle = billingCycle;
    }

    if (!planId) {
      this.applyCatalogSelection();
      return;
    }

    const matchedPlan = this.pricingPlans.find((plan) => plan.id === planId);
    if (!matchedPlan || matchedPlan.id === 'freemium' || matchedPlan.id === 'enterprise') {
      this.applyCatalogSelection();
      this.refreshPricingPlanCards();
      return;
    }

    this.preparePaidPlanSelection(matchedPlan, false);
    this.refreshPricingPlanCards();
  }

  private maybeResumeRequestedSubscription(stripeStatus?: string | null, redirectFlowId?: string | null) {
    if (!this.resumeSubscriptionFromQuery || !this.isAuthenticated() || !this.selectedPlan || this.busy) {
      return;
    }

    if (stripeStatus || redirectFlowId) {
      return;
    }

    if (!this.currentUserProfileResolved && !this.hasStoredBillingContact()) {
      return;
    }

    if (this.selectedProvider === 'stripe' || !!this.goCardlessForm.mandateId) {
      this.resumeSubscriptionFromQuery = false;
    }

    this.startSelectedPlanFlow();
  }

  private applyBillingContact(billingContact?: PaymentBillingContact) {
    if (!billingContact) {
      return;
    }

    const fullName = billingContact.fullName
      || [billingContact.givenName, billingContact.familyName].filter((value) => !!String(value || '').trim()).join(' ')
      || '';

    this.stripeForm.email = this.stripeForm.email || billingContact.email || '';
    this.stripeForm.customerEmail = this.stripeForm.customerEmail || billingContact.email || '';
    this.stripeForm.name = this.stripeForm.name || fullName;
    this.goCardlessForm.email = this.goCardlessForm.email || billingContact.email || '';
    this.goCardlessForm.givenName = this.goCardlessForm.givenName || billingContact.givenName || '';
    this.goCardlessForm.familyName = this.goCardlessForm.familyName || billingContact.familyName || '';
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

  private refreshPricingPlanCards(): void {
    const visiblePlans = this.isAuthenticated()
      ? this.pricingPlans.filter((plan) => plan.id !== 'freemium')
      : this.pricingPlans;

    this.visiblePricingPlanCards = visiblePlans.map((plan) => {
      const hasFixedPrice = this.hasFixedPrice(plan);
      const amount = hasFixedPrice ? this.getBillingAmount(plan) : 0;

      return {
        plan,
        amount,
        hasFixedPrice,
        periodLabel: this.getBillingPeriodLabel(plan),
        annualEquivalent: this.getAnnualEquivalent(plan),
        yearlySavings: this.getYearlySavings(plan),
        showYearlyMeta: this.billingCycle === 'yearly' && hasFixedPrice && !!plan.monthlyPrice && !!plan.yearlyPrice,
        showYearlyUpsell: this.billingCycle === 'monthly' && hasFixedPrice && !!plan.yearlyPrice,
      };
    });
  }

  private resolveSubscriptionSandboxAccess(emailOverride?: string): void {
    const tokenUser = this.getAuthenticatedUserFromToken();
    const resolvedEmail = String(emailOverride || tokenUser?.email || '').trim().toLowerCase();
    const resolvedRoles = this.authService.getRoles() || tokenUser?.role || [];
    const roles = Array.isArray(resolvedRoles) ? resolvedRoles : [resolvedRoles];

    this.canViewSubscriptionSandbox = this.hasSubscriptionSandboxAccess(resolvedEmail, roles);

    if (!this.canViewSubscriptionSandbox) {
      this.currentSubscription = null;
      this.stripeConfig = undefined;
      this.goCardlessConfig = undefined;
    }
  }

  private hasSubscriptionSandboxAccess(email: string, roles: string[]): boolean {
    const hasAdminRole = roles.some((role) => {
      const normalizedRole = String(role || '').trim().toUpperCase();
      return normalizedRole === 'ADMIN' || normalizedRole === 'SA';
    });
    return hasAdminRole && email === this.subscriptionSandboxAllowedEmail;
  }

  private getAuthenticatedUserFromToken(): { email?: string; role?: string[] } | undefined {
    const userId = sessionStorage.getItem(environment.storage.userId);
    if (!userId) {
      return undefined;
    }

    const token = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
    const decodedToken = token ? this.authService.decodeJWTToken(token) : undefined;
    return decodedToken?.user;
  }

  private navigateToSubscriptionCheckout(plan: PricingPlan): void {
    this.router.navigate([environment.routes.pricingPlans, 'checkout'], {
      queryParams: {
        plan: plan.id,
        billing: this.billingCycle,
      },
    });
  }

  private redirectToAuthenticationForPlan(plan: PricingPlan) {
    const returnUrl = this.router.serializeUrl(this.router.createUrlTree([environment.routes.pricingPlans, 'checkout'], {
      queryParams: {
        plan: plan.id,
        billing: this.billingCycle,
      },
    }));

    this.router.navigate([environment.routes.auth.login], {
      queryParams: { returnUrl },
    });
  }

  private buildGoCardlessSuccessRedirectUrl() {
    const params = new URLSearchParams({ provider: 'gocardless' });

    if (this.selectedPlan?.id) {
      params.set('plan', this.selectedPlan.id);
      params.set('billing', this.billingCycle);
    }

    if (this.resumeSubscriptionFromQuery) {
      params.set('action', 'subscribe');
    }

    return `${this.getPricingPageUrl()}?${params.toString()}`;
  }

  private scrollToSubscriptionPanel() {
    const subscriptionPanel = globalThis.document?.querySelector('.subscription-panel');
    subscriptionPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private isAuthenticated() {
    return this.authService.isAuthenticated();
  }
}
