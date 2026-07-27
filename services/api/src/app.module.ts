import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import configuration, { AppConfig } from './config/configuration'
import { CandidatesModule } from './modules/candidates/candidates.module'
import { JobsModule } from './modules/jobs/jobs.module'
import { PipelineModule } from './modules/pipeline/pipeline.module'
import { InterviewsModule } from './modules/interviews/interviews.module'
import { OffersModule } from './modules/offers/offers.module'
import { AssessmentsModule } from './modules/assessments/assessments.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { RealtimeModule } from './realtime/realtime.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        uri: config.get('mongoUri', { infer: true }),
      }),
    }),
    CandidatesModule,
    JobsModule,
    PipelineModule,
    InterviewsModule,
    OffersModule,
    AssessmentsModule,
    AnalyticsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
