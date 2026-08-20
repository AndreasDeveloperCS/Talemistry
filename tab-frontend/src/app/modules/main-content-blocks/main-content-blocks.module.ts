import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FeatureDetailsComponent } from './components/feature-details/feature-details.component';
import { HrRecruitmentCardsComponent } from './components/hr-recruitment-cards/hr-recruitment-cards.component';
import { PillarsComponent } from './components/pillars/pillars.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { SubscriptionCheckoutComponent } from './components/subscription-checkout/subscription-checkout.component';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { ContactUsWrapperComponent } from './components/contact-us-wrapper/contact-us-wrapper.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { ThemeSwitcherComponent } from '../general/components/theme-switcher/theme-switcher.component';

// const routes: Routes = [
//   { path: "features/:id", component: FeatureDetailsComponent },
// ]

@NgModule({
  declarations: [
    HrRecruitmentCardsComponent,
    PillarsComponent,
    FeatureDetailsComponent,
    PricingComponent,
    SubscriptionCheckoutComponent,
    SubscriptionComponent,
    ContactUsWrapperComponent,
  ],
  imports: [
    //RouterModule.forRoot(routes),
    //RouterModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    ContactUsComponent,
    ThemeSwitcherComponent,
  ],
  exports: [
    HrRecruitmentCardsComponent,
    PillarsComponent,
    FeatureDetailsComponent,
    PricingComponent,
    SubscriptionCheckoutComponent,
    SubscriptionComponent,
    ContactUsWrapperComponent
  ],
})
export class MainContentBlocksModule { }
