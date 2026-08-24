import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import {
  LucideAngularModule, GitCompareArrows, Briefcase, CalendarClock, Users, Filter, TrendingUp,
  TriangleAlert, ExternalLink, ChevronRight, Video, Calendar, Clock, Timer, CalendarX, Share2,
} from 'lucide-angular';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { environment } from 'src/environments/environment';
import { RecruiterDashboardComponent } from './components/recruiter-dashboard/recruiter-dashboard.component';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';
import { TmCardComponent } from '../general/components/ui/card/card.component';
import { TmBadgeComponent } from '../general/components/ui/badge/badge.component';
import { TmStatDeltaComponent } from '../general/components/ui/stat-delta/stat-delta.component';

const DASHBOARD_ICONS = {
  GitCompareArrows, Briefcase, CalendarClock, Users, Filter, TrendingUp, TriangleAlert,
  ExternalLink, ChevronRight, Video, Calendar, Clock, Timer, CalendarX, Share2,
};

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.dashboard.dashboardBlock,
    component: RecruiterDashboardComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.dashboard.dashboardBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    RecruiterDashboardComponent
  ],
  exports: [
    RecruiterDashboardComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    SunSpinnerComponent,
    RouterModule.forChild(routes),
    LucideAngularModule.pick(DASHBOARD_ICONS),
    TmCardComponent,
    TmBadgeComponent,
    TmStatDeltaComponent,
  ],
})
export class RecruiterDashboardModule { }
