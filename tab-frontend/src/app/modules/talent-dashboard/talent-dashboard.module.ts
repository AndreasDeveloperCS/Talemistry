import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { environment } from 'src/environments/environment';
import { TalentDashboardComponent } from './components/talent-dashboard/talent-dashboard.component';
import { GeneralModule } from '../general/general.module';

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.dashboard.dashboardBlock,
    component: TalentDashboardComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.dashboard.dashboardBlock, pathMatch: 'full' },
];

@NgModule({
    declarations: [
        TalentDashboardComponent
    ],
    exports: [
        TalentDashboardComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        GeneralModule,
        RouterModule.forChild(routes),
    ],
})
export class TalentDashboardModule { }
