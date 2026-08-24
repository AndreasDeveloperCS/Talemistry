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
import { DashboardTilesComponent } from './components/dashboard-tiles/dashboard-tiles.component';
import { RecruiterProfileComponent } from './components/recruiter-profile/recruiter-profile.component';
import { SidebarNavComponent } from '../user-profile/components/sidebar-nav/sidebar-nav.component';

const routes: Routes = [
  {
    path: '',
    component: RecruiterProfileComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.recruitmentTab.profile,
        component: ProfileCardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.recruitmentTab.schedule.schedule,
        loadChildren: () =>
          import('../../schedule/schedule.module').then(m => m.ScheduleModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.recruitmentTab.liveCoding.liveCoding,
        loadChildren: () =>
          import('../../live-coding/live-coding.module').then(m => m.LiveCodingModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.recruitmentTab.companyManagement.companyManagement,
        loadChildren: () =>
          import('../../company-management/company-management.module').then(m => m.CompanyManagementModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.recruitmentTab.pipelineBoard.pipelineBoard,
        loadChildren: () =>
          import('../../pipeline-board/pipeline-board.module').then(m => m.PipelineBoardModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.recruitmentTab.positionManagement.positionManagement,
        loadChildren: () =>
          import('../../position-management/position-management.module').then(m => m.PositionManagementModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.recruitmentTab.communication.communication,
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
        path: environment.routes.recruitmentTab.dashboard.dashboard,
        loadChildren: () =>
          import('../../recruiter-dashboard/recruiter-dashboard.module').then(m => m.RecruiterDashboardModule),
        canActivate: [AuthGuardService]
      },
      {
        path: environment.routes.recruitmentTab.team.team,
        loadChildren: () =>
          import('../../team/team.module').then(m => m.TeamModule),
        canActivate: [AuthGuardService],
      },
      {
        path: environment.routes.recruitmentTab.saved.saved,
        loadChildren: () =>
          import('../../saved/saved.module').then(m => m.SavedModule),
        canActivate: [AuthGuardService]
      },
      {
        path: '',
        redirectTo: `${environment.routes.recruitmentTab.profile}`,
        pathMatch: 'full'
      },
    ],
  }
];

@NgModule({
  declarations: [
    DashboardTilesComponent,
    RecruiterProfileComponent,
  ],
  exports: [
    DashboardTilesComponent,
    RecruiterProfileComponent,
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
export class RecruiterProfileModule { }
