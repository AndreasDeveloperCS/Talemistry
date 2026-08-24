import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { GeneralModule } from '../../general/general.module';
import { ProfileCardComponent } from '../user-profile/components/profile-card/profile-card.component';
import { SidebarNavComponent } from '../user-profile/components/sidebar-nav/sidebar-nav.component';
import { TalentProfileComponent } from './components/talent-profile/talent-profile.component';

const routes: Routes = [
  {
    path: '',
    component: TalentProfileComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.talentTab.profile,
        component: ProfileCardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.communication.communication,
        loadChildren: () =>
          import('../../interviews/interviews.module').then(m => m.InterviewsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.talentTab.expertise.expertise,
        loadChildren: () =>
          import('../../expertise/expertise.module').then(m => m.ExpertiseModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.cvTempletes.cvTempletes,
        loadChildren: () =>
          import('../../cv-templates/cv-templates.module').then(m => m.CvTemplatesModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.applicationManagement.applicationManagement,
        loadChildren: () =>
          import('../../application-management/applied-positions-management.module').then(m => m.AppliedPositionsManagementModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.liveCoding.liveCoding,
        loadChildren: () =>
          import('../../live-coding/live-coding.module').then(m => m.LiveCodingModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.recommendationManagement.recommendationManagement,
        loadChildren: () =>
          import('../../recommendation-management/recommendation-management.module').then(m => m.RecommendationManagementModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.talentTab.schedule.schedule,
        loadChildren: () =>
          import('../../schedule/schedule.module').then(m => m.ScheduleModule),
        canActivate: [AuthGuardService]
      },
      {
        path: 'payment-methods',
        loadChildren: () =>
          import('../../payments/payments.module').then(m => m.PaymentsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.talentTab.dashboard.dashboard,
        loadChildren: () =>
          import('../../talent-dashboard/talent-dashboard.module').then(m => m.TalentDashboardModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.talentTab.saved.saved,
        loadChildren: () =>
          import('../../saved/saved.module').then(m => m.SavedModule),
        canActivate: [AuthGuardService]
      },
      {
        path: '',
        redirectTo: `${environment.routes.talentTab.profile}`,
        pathMatch: 'full'
      },
    ],
  },
];

@NgModule({
  declarations: [
    TalentProfileComponent,
  ],
  exports: [
    TalentProfileComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    SidebarNavComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class TalentProfileModule { }
