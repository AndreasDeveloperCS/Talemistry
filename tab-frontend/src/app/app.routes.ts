import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { MainPageComponent } from './components/main-page/main-page.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuardService } from './modules/authentication/guard/auth-guard.service';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  {
    path: 'app/profile/:userId/info',
    redirectTo: `${environment.routes.userProfile}/:userId/info`,
    pathMatch: 'full'
  },
  {
    path: environment.routes.main,
    component: MainPageComponent
  },
  {
    path: environment.routes.privacyPolicy,
    loadChildren: () =>
      import('./modules/general/privacy-policy-route.module').then((m) => m.PrivacyPolicyRouteModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/public-pages/public-pages.module').then((m) => m.PublicPagesModule),
  },
  {
    path: environment.routes.publicProfile,
    loadChildren: () =>
      import('./modules/custom-public-profiles/public-profile-route.module').then((m) => m.PublicProfileRouteModule),
  },
  {
    path: environment.routes.screeningQuestionnaire,
    loadChildren: () =>
      import('./modules/position-management/screening-builder-route.module').then((m) => m.ScreeningBuilderRouteModule),
  },
  {
    path: environment.routes.liveCoding,
    loadChildren: () =>
      import('./modules/live-coding/live-coding.module').then((m) => m.LiveCodingModule),
  },
  {
    path: environment.routes.authentication,
    loadChildren: () =>
      import('./modules/authentication/authentication.module').then(m => m.AuthenticationModule)
  },
  {
    path: environment.routes.career,
    loadChildren: () =>
      import('./modules/positions/positions.module').then(m => m.PositionsModule),
  },
  {
    path: environment.serverPaths.schedule,
    loadChildren: () =>
      import('./modules/meetings/meetings.module').then((m) => m.MeetingsModule)
  },
  {
    path: environment.routes.user,
    loadChildren: () =>
      import('./modules/profiles/user-profile/user-profile.module').then(m => m.UserProfileModule)
  },
  {
    path: environment.routes.admin,
    loadChildren: () =>
      import('./modules/profiles/admin-profile/admin-profile.module').then(m => m.AdminProfileModule),
    canActivate: [AuthGuardService]
  },
  {
    path: environment.routes.recruitment,
    loadChildren: () =>
      import('./modules/profiles/recruiter-profile/recruiter-profile.module').then(m => m.RecruiterProfileModule),
    canActivate: [AuthGuardService]
  },
  {
    path: environment.routes.talent,
    loadChildren: () =>
      import('./modules/profiles/talent-profile/talent-profile.module').then(m => m.TalentProfileModule),
    canActivate: [AuthGuardService]
  },
  {
    path: environment.routes.interviewer,
    loadChildren: () =>
      import('./modules/profiles/interviewer-profile/interviewer-profile.module').then(m => m.InterviewerProfileModule),
    canActivate: [AuthGuardService]
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }