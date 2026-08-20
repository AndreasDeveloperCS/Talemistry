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
import { InterviewsModule } from '../interviews/interviews.module';
import { PositionPipelinesModule } from '../position-pipelines/position-pipelines.module';
import { PositionsModule } from '../positions/positions.module';
import { InterviewAssessmentComponent } from './components/interview-assessment/interview-assessment.component';
import { PipelineStageInfoComponent } from './components/pipeline-stage-info/pipeline-stage-info.component';
import { PositionCardComponent } from './components/position-card/position-card.component';
import { PositionManagementBlockComponent } from './components/position-management-block/position-management-block.component';
import { PositionManagementComponent } from './components/position-management/position-management.component';
import { ScreeningBuilderComponent } from './components/screening-builder/screening-builder.component';
import { ScreeningFormComponent } from './components/screening-form/screening-form.component';
import { ScreeningResponseViewComponent } from './components/screening-response-view/screening-response-view.component';
import { TalentsComponent } from './components/talents/talents.component';

const routes: Routes = [
  {
    path: environment.routes.recruitmentTab.positionManagement.positionManagementBlock,
    component: PositionManagementBlockComponent,
    canActivate: [AuthGuardService],
  },
  { path: '', redirectTo: environment.routes.recruitmentTab.positionManagement.positionManagementBlock, pathMatch: 'full' },
];

@NgModule({
  declarations: [
    PositionManagementComponent,
    PositionCardComponent,
    PositionManagementBlockComponent,
    TalentsComponent,
    InterviewAssessmentComponent,
    PipelineStageInfoComponent,
    ScreeningBuilderComponent,
    ScreeningFormComponent,
    ScreeningResponseViewComponent,
  ],
  exports: [
    PositionManagementComponent,
    PositionCardComponent,
    PositionManagementBlockComponent,
    TalentsComponent,
    InterviewAssessmentComponent,
    PipelineStageInfoComponent,
    ScreeningBuilderComponent,
    ScreeningFormComponent,
    ScreeningResponseViewComponent,
  ],
  imports: [
    GeneralModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    PositionsModule,
    PositionPipelinesModule,
    InterviewsModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: ViewEncapsulation, useValue: ViewEncapsulation.None
    }]
})
export class PositionManagementModule { }
