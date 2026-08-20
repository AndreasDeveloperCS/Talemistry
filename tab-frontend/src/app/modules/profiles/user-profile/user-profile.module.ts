import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { ROLES } from '../../authentication/models/roles';
import { GeneralModule } from '../../general/general.module';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { PaymentMethodsComponent } from './components/payment-methods/payment-methods.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { CommunicationModule } from '../../communication/communication.module';
import { RecruiterActivityAccessModule } from '../../recruiter-activity-access/recruiter-activity-access.module';

const routes: Routes = [
  {
    path: `profile/:userId`,
    component: UserProfileComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: ROLES.ADMIN.toLocaleLowerCase(),
        loadChildren: () =>
          import('./../admin-profile/admin-profile.module').then(m => m.AdminProfileModule),
        canActivate: [AuthGuardService]
      },
      {
        path: `${ROLES.TALENT.toLocaleLowerCase()}`,
        loadChildren: () =>
          import('./../talent-profile/talent-profile.module').then(m => m.TalentProfileModule),
        canActivate: [AuthGuardService]
      },
      {
        path: `${ROLES.RECRUITMENT.toLocaleLowerCase()}`,
        //component: RecruiterProfileComponent,
        loadChildren: () =>
          import('./../recruiter-profile/recruiter-profile.module').then(m => m.RecruiterProfileModule),
        canActivate: [AuthGuardService]
      },
    ]
  },
  {
    path: `profile`, component: UserProfileComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'payment-methods',
    component: PaymentMethodsComponent,
    canActivate: [AuthGuardService],
  },
  { path: 'user/profile', redirectTo: 'profile', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    UserProfileComponent,
    ChangePasswordDialogComponent,
    ProfileCardComponent,
  ],
  exports: [
    UserProfileComponent,
    ChangePasswordDialogComponent,
    ProfileCardComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    CommunicationModule,
    PaymentMethodsComponent,
    RecruiterActivityAccessModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ]
})
export class UserProfileModule { }
