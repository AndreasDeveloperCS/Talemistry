import { CUSTOM_ELEMENTS_SCHEMA, NgModule, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterviewsPanelComponent } from './components/interviews-panel/interviews-panel.component';
import { PipelineHeaderComponent } from './components/pipeline-header/pipeline-header.component';
import { PositionsPanelComponent } from './components/positions-panel/positions-panel.component';
import { ContentPanelComponent } from './components/content-panel/content-panel.component';
import { ApplicantsPanelComponent } from './components/applicants-panel/applicants-panel.component';
import { PipelineBoardComponent } from './components/pipeline-board/pipeline-board.component';
import { GeneralModule } from '../general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthGuardService } from '../authentication/guard/auth-guard.service';
import { MeetingInvitationsModule } from '../meeting-invitations/meeting-invitations.module';
import { NextStageDialogComponent } from './components/next-stage-dialog/next-stage-dialog.component';
import { PositionManagementModule } from '../position-management/position-management.module';
import { MatDialogModule } from '@angular/material/dialog';
import { SunSpinnerComponent } from '../general/components/sun-spinner/sun-spinner.component';

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.pipelineBoard.pipelineBoardBlock,
    component: PipelineBoardComponent,
    canActivate: [AuthGuardService]
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.pipelineBoard.pipelineBoardBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    PipelineBoardComponent,
    ApplicantsPanelComponent,
    ContentPanelComponent,
    InterviewsPanelComponent,
    PipelineHeaderComponent,
    PositionsPanelComponent,
    NextStageDialogComponent,
  ],
  exports: [
    PipelineBoardComponent,
    ApplicantsPanelComponent,
    ContentPanelComponent,
    InterviewsPanelComponent,
    PipelineHeaderComponent,
    PositionsPanelComponent,
    NextStageDialogComponent,
  ],
  imports: [
    CommonModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatIconModule,
    MatDialogModule,
    MeetingInvitationsModule,
    PositionManagementModule,
    SunSpinnerComponent,
    RouterModule.forChild(routes)
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    },
  ]
})
export class PipelineBoardModule { }
