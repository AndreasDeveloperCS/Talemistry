import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { MainContentBlocksModule } from '../main-content-blocks/main-content-blocks.module';
import { PaymentInfoComponent } from './components/payment-info/payment-info.component';

const routes: Routes = [
  {
    path: environment.routes.talentTab.paymentMethods.paymentMethodsBlock,
    component: PaymentInfoComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.recruitmentTab.paymentMethods.paymentMethodsBlock,
    component: PaymentInfoComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: environment.routes.interviewerTab.paymentMethods.paymentMethodsBlock,
    component: PaymentInfoComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.talentTab.paymentMethods.paymentMethodsBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    PaymentInfoComponent
  ],
  exports: [
    PaymentInfoComponent
  ],
  imports: [
    CommonModule,
    GeneralModule,
    MainContentBlocksModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    },
  ]
})
export class PaymentsModule { }