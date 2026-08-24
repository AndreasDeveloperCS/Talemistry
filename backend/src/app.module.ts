import { HttpModule } from "@nestjs/axios";
import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, DiscoveryService, ModuleRef } from '@nestjs/core';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { join } from 'path';
import { Connection } from 'mongoose';
import { GatewayInspector } from "./app.service";
import { getTypeOrmOptions } from "./app/common/utils/db.helper";
import { getBaseDir } from "./app/common/utils/path.helper";
import { NotFoundInterceptor } from './app/interceptors/not-found-interceptor';
import { AiModuleModule } from "./app/modules/ai/ai.module";
import { AuthModule } from './app/modules/auth/auth.module';
import { AuthController } from "./app/modules/auth/controllers/auth.controller";
import { AuthService } from "./app/modules/auth/services/auth.service";
import { GoogleAuthService } from "./app/modules/auth/services/google-auth.service";
import { BlogModule } from './app/modules/blog/blog.module';
import { BriefsModule } from "./app/modules/briefs/briefs.module";
import { CommunicationModule } from "./app/modules/communication/communication.module";
import { CompaniesModule } from "./app/modules/companies/companies.module";
import { CvsModule } from './app/modules/cvs/cvs.module';
import { EmailModule } from './app/modules/email/email.module';
import { HealthCheckModule } from "./app/modules/health-check/health-check.module";
import { OpportunitiesManagersModule } from "./app/modules/hiring-managers/opportunities-managers.module";
import { LocationsModule } from './app/modules/locations/locations.module';
import { LogModule } from "./app/modules/log/log.module";
import { MeetingsModule } from './app/modules/meetings/meetings.module';
import { MotivationalFactorsModule } from "./app/modules/motivational-factors/motivational-factors.module";
import { PermissionGuard } from "./app/modules/permissions/guards/permission-guard";
import { PermissionsModule } from "./app/modules/permissions/permissions.module";
import { PositionBenefitsModule } from "./app/modules/position-benefits/position-benefits.module";
import { PositionPipelinesModule } from "./app/modules/position-pipelines/position-pipelines.module";
import { PositionTalentsModule } from "./app/modules/position-talents/position-talents.module";
import { PositionWorkflowModule } from "./app/modules/position-workflow/position-workflow.module";
import { PositionsModule } from './app/modules/positions/positions.module';
import { PaymentsModule } from './app/modules/payments/payments.module';
import { PresentationContentModule } from "./app/modules/presentation-content/presentation-content.module";
import { ProfilesModule } from './app/modules/profiles/profiles.module';
import { RecruitmentPlatformModule } from "./app/modules/recruitment-platform/recruitment-platform.module";
import { ScreeningQuestionnaireModule } from "./app/modules/screening-questionnaire/screening-questionnaire.module";
import { SkillsModule } from './app/modules/skills/skills.module';
import { SocialMediaModule } from './app/modules/social-media/social-media.module';
import { UniversitiesModule } from './app/modules/universities/universities.module';
import { UserModule } from './app/modules/users/user.module';
import { VideoService } from './app/modules/video/services/video.service';
import { VisitorsModule } from './app/modules/visitors/visitors.module';
import { MongodbConfigService } from './app/services/mongodb.config.service';
import { VideoModule } from "./app/modules/video/video.module";
import { BulkgateModule } from "./app/modules/bulkgate/bulkgate.module";
import { LiveCodingModule } from "./app/modules/live-coding/live-coding.module";
import { RecruiterActivityAccessModule } from "./app/modules/recruiter-activity-access/recruiter-activity-access.module";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MongodbConfigService,
    }),
    TypeOrmModule.forRoot(getTypeOrmOptions()),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    VisitorsModule,
    UserModule,
    AuthModule,
    BlogModule,
    LocationsModule,
    SocialMediaModule,
    UniversitiesModule,
    PositionsModule,
    SkillsModule,
    EmailModule,
    CvsModule,
    ProfilesModule,
    PositionTalentsModule,
    MeetingsModule,
    PositionBenefitsModule,
    MotivationalFactorsModule,
    CompaniesModule,
    RecruitmentPlatformModule,
    AiModuleModule,
    BriefsModule,
    PermissionsModule,
    PresentationContentModule,
    LogModule,
    VisitorsModule,
    HealthCheckModule,
    OpportunitiesManagersModule,
    PositionWorkflowModule,
    PositionPipelinesModule,
    PaymentsModule,
    CommunicationModule,
    ScreeningQuestionnaireModule,
    RecruiterActivityAccessModule,
    VideoModule,
    LiveCodingModule,
    BulkgateModule,
    ServeStaticModule.forRoot(
      {
        rootPath: join(getBaseDir(), 'public', 'assets'), // fonts, images, css
        serveRoot: '/assets',
      },
      {
        rootPath: join(getBaseDir(), 'public', 'social-media-icons'), // First static folder
        serveRoot: '/public/social-media-icons', // URL prefix for the first static folder
        serveStaticOptions: {
          index: false, // Disable looking for 'index.html'
        },
      },
      // {
      //   rootPath: join(getBaseDir(), '..', 'video-chat'),
      //   // exclude: ['/api*'],
      //   serveRoot: '/video-chat'
      // },
      {
        rootPath: join(getBaseDir(), 'static-content'), // Second static folder
        serveRoot: '/static-content', // URL prefix for the second static folder
      }
    ),
    // WebSocketsModule.forRoot({
    //   transport: WebSocket.Server,
    //   options: {
    //     wsOptions: {
    //       maxPayload: 16 * 1024 * 1024,
    //     },
    //   },
    // }),
  ],
  controllers: [
    AuthController
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: NotFoundInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    DiscoveryService,
    GatewayInspector,
    AuthService,
    GoogleAuthService,
    VideoService,
    ConfigService
  ],
  exports: [
    MongooseModule,
    ConfigService
  ],
})
export class AppModule implements OnApplicationShutdown {

  constructor(
    private readonly moduleRef: ModuleRef,
    @InjectConnection() private readonly connection: Connection
  ) { }

  async onApplicationShutdown(signal?: string) {
    console.log(`🔌 Application shutdown signal received: ${signal}`);

    try {
      // Gracefully close MongoDB connection
      if (this.connection && this.connection.readyState !== 0) {
        console.log('📊 Closing MongoDB connection...');
        await this.connection.close();
        console.log('✅ MongoDB connection closed successfully');
      } else {
        console.log('ℹ️ MongoDB connection already closed or not initialized');
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

}

