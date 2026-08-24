import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { MainContentBlocksModule } from '../main-content-blocks/main-content-blocks.module';
import { ContactUsWrapperComponent } from '../main-content-blocks/components/contact-us-wrapper/contact-us-wrapper.component';
import { FeatureDetailsComponent } from '../main-content-blocks/components/feature-details/feature-details.component';
import { PricingComponent } from '../main-content-blocks/components/pricing/pricing.component';
import { SubscriptionCheckoutComponent } from '../main-content-blocks/components/subscription-checkout/subscription-checkout.component';
import { SubscriptionComponent } from '../main-content-blocks/components/subscription/subscription.component';

const routes: Routes = [
  {
    path: environment.routes.pricingPlans,
    component: PricingComponent,
  },
  {
    path: `${environment.routes.pricingPlans}/checkout`,
    component: SubscriptionCheckoutComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.subscription,
    component: SubscriptionComponent,
  },
  {
    path: environment.routes.contactUs,
    component: ContactUsWrapperComponent,
  },
  {
    path: 'features/:id',
    component: FeatureDetailsComponent,
  },
];

@NgModule({
  imports: [
    MainContentBlocksModule,
    RouterModule.forChild(routes),
  ],
})
export class PublicPagesModule { }