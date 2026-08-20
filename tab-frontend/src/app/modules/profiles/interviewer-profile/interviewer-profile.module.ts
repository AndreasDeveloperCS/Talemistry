import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { GeneralModule } from '../../general/general.module';
import { ImageCropperDialogComponent } from '../user-profile/components/image-cropper-dialog/image-cropper-dialog.component';
import { ProfileCardComponent } from '../user-profile/components/profile-card/profile-card.component';
import { SidebarNavComponent } from '../user-profile/components/sidebar-nav/sidebar-nav.component';
import { InterviewerProfileComponent } from './components/interviewer-profile/interviewer-profile.component';

const routes: Routes = [
  {
    path: '',
    component: InterviewerProfileComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.interviewerTab.profile,
        component: ProfileCardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.interviewerTab.schedule.schedule,
        loadChildren: () =>
          import('../../schedule/schedule.module').then(m => m.ScheduleModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.interviewerTab.liveCoding.liveCoding,
        loadChildren: () =>
          import('../../live-coding/live-coding.module').then(m => m.LiveCodingModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.interviewerTab.communication.communication,
        loadChildren: () =>
          import('../../interviews/interviews.module').then(m => m.InterviewsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: 'payment-methods',
        loadChildren: () =>
          import('../../payments/payments.module').then(m => m.PaymentsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.interviewerTab.dashboard.dashboard,
        loadChildren: () =>
          import('../../recruiter-dashboard/recruiter-dashboard.module').then(m => m.RecruiterDashboardModule),
        canActivate: [AuthGuardService]
      },
      {
        path: '',
        redirectTo: `${environment.routes.interviewerTab.profile}`,
        pathMatch: 'full'
      },
    ],
  }
];

@NgModule({
  declarations: [
    InterviewerProfileComponent
  ],
  exports: [
    InterviewerProfileComponent
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    ImageCropperDialogComponent,
    SidebarNavComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class InterviewerProfileModule { }
