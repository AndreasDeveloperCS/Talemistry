import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BaseModule } from '../base/base.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { PermissionGuard } from '../permissions/guards/permission-guard';
import { PermissionsModule } from '../permissions/permissions.module';
import { PositionsModule } from '../positions/positions.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UserModule } from '../users/user.module';
import { PipelineStagesController } from './controllers/pipeline-stage.controller';
import { PipelineTemplateController } from './controllers/pipeline-template.controller';
import { PositionPipelinesController } from './controllers/position-pipelines.controller';
import { TalentNotesController } from './controllers/talent-notes.controller';
import { TalentPipelineProgressController } from './controllers/talent-pipeline-progress.controller';
import { InterviewFeedbackDetails, InterviewFeedbackDetailsSchema } from './models/interview-feedback-details';
import { PipelineStage, PipelineStageSchema } from './models/pipeline-stage';
import { PositionPipeline, PositionPipelineSchema } from './models/position-pipeline';
import { TalentNote, TalentNoteSchema } from './models/talent-note';
import { TalentPipelineProgress, TalentPipelineProgressSchema } from './models/talent-pipeline-progress';
import { InterviewFeedbackDetailsService } from './services/interview-feedback-details.service';
import { PipelineStagesService } from './services/pipeline-stages.service';
import { PositionPipelinesService } from './services/position-pipelines.service';
import { TalentNotesService } from './services/talent-notes.service';
import { TalentPipelineProgressService } from './services/talent-pipeline-progress.service';
import { PipelineStageFeedbacksController } from './controllers/pipeline-stage-feedback.controller';
import { PipelineStageFeedbacksService } from './services/pipeline-stage-feedback.service';
import { PipelineStageFeedback, PipelineStageFeedbackSchema } from './models/pipeline-stage-feedback';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      PipelineStage,
      InterviewFeedbackDetails,
      PositionPipeline,
      TalentPipelineProgress,
      TalentNote,
      PipelineStageFeedback,
    ]),
    HttpModule,
    BaseModule,
    UserModule,
    AuthModule,
    PermissionsModule,
    InterviewsModule,
    ProfilesModule,
    forwardRef(() => PositionsModule),
    MongooseModule.forFeature([
      {
        name: PipelineStage.name,
        schema: PipelineStageSchema,
      },
      {
        name: InterviewFeedbackDetails.name,
        schema: InterviewFeedbackDetailsSchema
      },
      {
        name: PositionPipeline.name,
        schema: PositionPipelineSchema
      },
      {
        name: TalentPipelineProgress.name,
        schema: TalentPipelineProgressSchema
      },
      {
        name: TalentNote.name,
        schema: TalentNoteSchema
      },
      {
        name: PipelineStageFeedback.name,
        schema: PipelineStageFeedbackSchema
      },
    ]),
  ],
  controllers: [
    PipelineStagesController,
    PipelineTemplateController,
    PositionPipelinesController,
    TalentPipelineProgressController,
    TalentNotesController,
    PipelineStageFeedbacksController,
  ],
  providers: [
    InterviewFeedbackDetailsService,
    PipelineStagesService,
    PositionPipelinesService,
    TalentPipelineProgressService,
    PermissionGuard,
    TalentNotesService,
    PipelineStageFeedbacksService,
  ],
  exports: [
    PositionPipelinesService,
    TalentPipelineProgressService,
    PipelineStageFeedbacksService,
  ]
})
export class PositionPipelinesModule { }
