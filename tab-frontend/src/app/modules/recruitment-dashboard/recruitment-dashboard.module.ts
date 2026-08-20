import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { RecruitmentDashboardComponent } from './components/recruitment-dashboard/recruitment-dashboard.component';
import { environment } from 'src/environments/environment';

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.dashboard.dashboardBlock,
    component: RecruitmentDashboardComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.dashboard.dashboardBlock, pathMatch: 'full' },
];

@NgModule({
    declarations: [
        RecruitmentDashboardComponent
    ],
    exports: [
        RecruitmentDashboardComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        RouterModule.forChild(routes),
    ],
})
export class RecruitmentDashboardModule { }
