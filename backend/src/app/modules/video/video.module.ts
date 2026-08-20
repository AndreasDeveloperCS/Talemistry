import { Module } from '@nestjs/common';
import { VideoController } from './controllers/video.controller';
import { VideoRecordsController } from './controllers/video-records/video-records.controller';
import { VideoRecordService } from './services/video-record/video-record.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoRecord, VideoRecordSchema } from './models/video-record';
import { MulterModule } from '@nestjs/platform-express';
import { HttpModule } from '@nestjs/axios';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { ConfigModule } from '@nestjs/config';
import * as multer from 'multer';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { LogModule } from '../log/log.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UserModule } from '../users/user.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { VideoService } from './services/video.service';
import { BaseModule } from '../base/base.module';
import { AWSFileShareService } from '../base/services/aws-fileshare.service';
import { S3Service } from '../base/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoRecord,
    ]),
    MongooseModule.forFeature([
      {
        name: VideoRecord.name, schema: VideoRecordSchema
      },
    ]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    BaseModule,
    EmailModule,
    VisitorsModule,
    UserModule,
    AuthModule,
    MeetingsModule,
    LogModule,
    ProfilesModule,
  ],
  controllers: [
    VideoController,
    VideoRecordsController,
  ],
  providers: [
    VideoRecordService,
    VideoService,
    AWSFileShareService,
    S3Service
  ],
  exports: [
    MongooseModule,

    VideoRecordService
  ],
})
export class VideoModule { }
