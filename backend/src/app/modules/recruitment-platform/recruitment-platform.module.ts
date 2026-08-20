import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';

import { JwtService } from '@nestjs/jwt';
import { EmptyModel, EmptySchema } from '../base/models/empty-model';
import { UtilitiesService } from '../core/services/utilities.service';
import { JoinController } from './controllers/join-platform.controller';
import { LinkedInRecruitmentPlatformController } from './controllers/linked-in-recruitment-platform.controller';
import { LinkedInAuthenticationController } from './controllers/linkedin-authentication.controller';
import { RecruitmentPlatformController } from './controllers/recruitment-platform.controller';
import { SessionTokenController } from './controllers/session-token.controller';
import { UserRecruitmentPlatformController } from './controllers/user-recruitment-platform.controller';
import { WorkableController } from './controllers/workable-platform.controller';
import { JoinJob, JoinJobSchema } from './models/join-jobs';
import { LinkedInSessionToken, LinkedInSessionTokenSchema } from './models/linkedin-session-token';
import { LinkedInUser, LinkedInUserSchema } from './models/linkedin-user';
import { RecruitmentPlatform, RecruitmentPlatformSchema } from './models/recruitment-platform';
import { WorkableRequisition, WorkableRequisitionSchema } from './models/requisition';
import { UserRecruitmentPlatform, UserRecruitmentPlatformSchema } from './models/user-recruitment-platform';
import { JoinAdapterService } from './services/join-adapter.service';
import { LinkedInAdapterService } from './services/linked-in-adapter.service';
import { LinkedInSessionService } from './services/linkedin-session.service';
import { RecruitmentPlatformService } from './services/recruitment-platform.service';
import { UserRecruitmentPlatformService } from './services/user-recruitment-platform.service';
import { WorkableAdapterService } from './services/workable-adapter.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      RecruitmentPlatform,
      UserRecruitmentPlatform,
      LinkedInSessionToken,
      WorkableRequisition,
      JoinJob,
      LinkedInUser,
      EmptyModel
    ]),
    HttpModule,
    BaseModule,
    MongooseModule.forFeature([
      {
        name: RecruitmentPlatform.name,
        schema: RecruitmentPlatformSchema,
      },
      {
        name: UserRecruitmentPlatform.name,
        schema: UserRecruitmentPlatformSchema,
      },
      {
        name: LinkedInSessionToken.name,
        schema: LinkedInSessionTokenSchema,
      },
      {
        name: WorkableRequisition.name,
        schema: WorkableRequisitionSchema,
      },
      {
        name: JoinJob.name,
        schema: JoinJobSchema,
      },
      {
        name: LinkedInUser.name,
        schema: LinkedInUserSchema,
      },
      {
        name: EmptyModel.name,
        schema: EmptySchema,
      }
    ]),
  ],
  controllers: [
    RecruitmentPlatformController,
    LinkedInRecruitmentPlatformController,
    LinkedInAuthenticationController,
    UserRecruitmentPlatformController,
    WorkableController,
    SessionTokenController,
    JoinController
  ],
  providers: [
    UtilitiesService,
    JwtService,
    RecruitmentPlatformService,
    LinkedInAdapterService,
    LinkedInSessionService,
    UserRecruitmentPlatformService,
    WorkableAdapterService,
    JoinAdapterService],
  exports: [LinkedInSessionService, LinkedInAdapterService]
})
export class RecruitmentPlatformModule { }
