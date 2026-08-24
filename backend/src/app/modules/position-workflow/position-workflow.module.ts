import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { AuthModule } from '../auth/auth.module';
import { BaseModule } from '../base/base.module';
import { UserModule } from '../users/user.module';
import { PositionWorkflowStageController } from './controllers/position-workflow-stage.controller';
import { PositionWorkflowController } from './controllers/position-workflow.controller';
import { PositionWorkflow, PositionWorkflowSchema } from './models/position-workflow';
import { PositionWorkflowStage, PositionWorkflowStageSchema } from './models/position-workflow-stage';
import { PositionWorkflowStageService } from './services/position-workflow-stage.service';
import { PositionWorkflowService } from './services/position-workflow.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      PositionWorkflow, PositionWorkflowStage,
    ]),
    HttpModule,
    BaseModule,
    UserModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: PositionWorkflow.name, schema: PositionWorkflowSchema
      },
      {
        name: PositionWorkflowStage.name, schema: PositionWorkflowStageSchema
      },
    ]),
  ],
  controllers: [
    PositionWorkflowStageController,
    PositionWorkflowController,
  ],
  providers: [
    PositionWorkflowStageService,
    PositionWorkflowService,
  ],
  exports: [
    PositionWorkflowStageService,
    PositionWorkflowService,
  ]
})
export class PositionWorkflowModule { }
