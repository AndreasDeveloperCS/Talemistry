import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import {
    RECAPTCHA_V3_SITE_KEY,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaV3Module
} from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { RecoveryPasswordComponent } from './components/recovery-password/recovery-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GeneralModule } from '../general/general.module';
import { MatDialogModule } from '@angular/material/dialog';

const routes: Routes = [
    {
      path: '',
      component: AuthenticationComponent,
      children: [
        { path: 'login', component: LoginFormComponent },
        { path: 'register', component: RegistrationFormComponent },
        { path: 'password-recovery', component: RecoveryPasswordComponent },
        {
            path: `:userId/verification-id/:requestId`, component: EmailVerificationComponent
        },
        { path: '', redirectTo: 'login', pathMatch: 'full' },
        { path: '**', redirectTo: 'login' },
      ]
    },
];

@NgModule({
  declarations: [
    LoginFormComponent,
    RegistrationFormComponent,
    AuthenticationComponent,
    EmailVerificationComponent, 
    RecoveryPasswordComponent
  ],
  exports: [
    LoginFormComponent,
    RegistrationFormComponent,
    AuthenticationComponent,
    EmailVerificationComponent, 
    RecoveryPasswordComponent
  ],
  imports: [
    CommonModule,
    GeneralModule,
    MatIconModule,
    FormsModule,
    MatDialogModule,
    ReactiveFormsModule,
    RouterModule,
    RecaptchaFormsModule,
    RecaptchaModule,
    RecaptchaV3Module,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
        provide: RECAPTCHA_V3_SITE_KEY,
        useValue: environment.RECAPTCHA_KEY_V3
    },
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class AuthenticationModule {
  constructor() {
      console.log(this.constructor.name);
      console.log('AuthenticationModule loaded');
  }
 }
