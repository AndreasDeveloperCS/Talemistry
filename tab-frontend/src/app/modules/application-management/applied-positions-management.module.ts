import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { GeneralModule } from '../general/general.module';
import { AppliedPositionsManagementComponent } from './components/applied-positions-management/applied-positions-management.component';
import { AppliedPositionsBlockComponent } from './components/applied-positions-management-block/applied-positions-management-block.component';
import { AppliedPositionCardComponent } from './components/applied-position-card/applied-position-card.component';
import { ApplicationTrackerComponent } from './components/application-tracker/application-tracker.component';
import { ApplicantDashboardComponent } from './components/applicant-dashboard/applicant-dashboard.component';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';

const routes: Routes = [
  {
    path: environment.routes.talentTab.applicationManagement.applicationManagementBlock,
    component: AppliedPositionsBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.talentTab.applicationManagement.applicationManagementBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    AppliedPositionsManagementComponent,
    AppliedPositionsBlockComponent,
    AppliedPositionCardComponent,
    ApplicationTrackerComponent,
    ApplicantDashboardComponent,
  ],
  exports: [
    AppliedPositionsManagementComponent,
    AppliedPositionsBlockComponent,
    AppliedPositionCardComponent,
    ApplicationTrackerComponent,
    ApplicantDashboardComponent,
  ],
  imports: [
    GeneralModule,
    SunSpinnerComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }]
})
export class AppliedPositionsManagementModule { }
