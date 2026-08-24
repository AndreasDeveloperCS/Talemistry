import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthGuardService } from '../../authentication/guard/auth-guard.service';
import { GeneralModule } from '../../general/general.module';
import { RolesService } from '../../permissions/services/roles.service';
import { ProfileCardComponent } from '../user-profile/components/profile-card/profile-card.component';
import { SidebarNavComponent } from '../user-profile/components/sidebar-nav/sidebar-nav.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';

const routes: Routes = [
  {
    path: '',
    component: AdminProfileComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.adminTab.profile,
        component: ProfileCardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.adminTab.users.users,
        loadChildren: () =>
          import('../../users/users.module').then(m => m.UsersModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.permissions.permissions,
        loadChildren: () =>
          import('../../permissions/permissions.module').then(m => m.PermissionsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.companies.companies,
        loadChildren: () =>
          import('../../companies/companies.module').then(m => m.CompaniesModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.visitors.visitors,
        loadChildren: () =>
          import('../../visitors/visitors.module').then(m => m.VisitorsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.career,
        loadChildren: () =>
          import('../../positions/positions.module').then(m => m.PositionsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.skills.skills,
        loadChildren: () =>
          import('../../skills/skills.module').then(m => m.SkillsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.universities.universities,
        loadChildren: () =>
          import('../../universities/universities.module').then(m => m.UniversitiesModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.recruitmentPlatforms.recruitmentPlatforms,
        loadChildren: () =>
          import('../../recruitment-platform/recruitment-platform.module').then(m => m.RecruitmentPlatformModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.positionBenefits.positionBenefits,
        loadChildren: () =>
          import('../../position-benefits/position-benefits.module').then(m => m.PositionBenefitsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.motivationalFactors.motivationalFactors,
        loadChildren: () =>
          import('../../motivational-factors/motivational-factors.module').then(m => m.MotivationalFactorsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.screeningQuestionnaires.screeningQuestionnaires,
        loadChildren: () =>
          import('../../screening-questionnaire/screening-questionnaire.module').then(m => m.ScreeningQuestionnaireModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.socialMedia.social,
        loadChildren: () =>
          import('../../social-media/social-media.module').then(m => m.SocialMediaModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.schedule.schedule,
        loadChildren: () =>
          import('../../schedule/schedule.module').then(m => m.ScheduleModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.communication.communication,
        loadChildren: () =>
          import('../../interviews/interviews.module').then(m => m.InterviewsModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.adminTab.dashboard.dashboard,
        loadChildren: () =>
          import('../../recruitment-dashboard/recruitment-dashboard.module').then(m => m.RecruitmentDashboardModule),
        canActivate: [AuthGuardService]
      },
      {
        path: '',
        redirectTo: `${environment.routes.adminTab.profile}`,
        pathMatch: 'full'
      },
    ],
  }
];

@NgModule({
  declarations: [
    AdminProfileComponent,
  ],
  exports: [
    AdminProfileComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    SidebarNavComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    RolesService,
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class AdminProfileModule { }
