import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { InterviewerDashboardComponent } from './components/interviewer-dashboard/interviewer-dashboard.component';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  {
    path: environment.routes.interviewerTab.dashboard.dashboardBlock,
    component: InterviewerDashboardComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.interviewerTab.dashboard.dashboardBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    InterviewerDashboardComponent
  ],
  exports: [
    InterviewerDashboardComponent
  ],
  imports: [
      CommonModule,
      MatIconModule,
      RouterModule.forChild(routes),
  ],
})
export class InterviewerDashboardModule { }
