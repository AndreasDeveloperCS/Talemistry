import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { environment } from "src/environments/environment";
import { AuthGuardService } from "../authentication/guard/auth-guard.service";
import { TeamBlockComponent } from "./components/team-block/team-block.component";
import { MatTabsModule } from "@angular/material/tabs";

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.team.teamBlock,
    component: TeamBlockComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: environment.routes.recruitmentTab.team.activityAccess,
        loadChildren: () =>
          import('../../modules/recruiter-activity-access/recruiter-activity-access.module').then(m => m.RecruiterActivityAccessModule),
        canActivate: [AuthGuardService]
      },
    ]
  },
];

@NgModule({
  declarations: [
    TeamBlockComponent,
  ],
  exports: [
    TeamBlockComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    MatTabsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }
  ],
})
export class TeamModule { }
