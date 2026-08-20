import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BaseModule } from '../base/base.module';
import { OpportunitiesManagersModule } from '../hiring-managers/opportunities-managers.module';
import { UserModule } from '../users/user.module';
import { PositionsLikedController } from './controllers/positions-liked.controller';
import { PositionsController } from './controllers/positions.controller';
import { VerifiedPositionsController } from './controllers/verified-positions.controller';
import { OpenPosition, OpenPositionSchema } from './models/open-position';
import { PositionLiked, PositionLikedSchema } from './models/position-liked';
import { PositionsLikedService } from './services/positions-liked.service';
import { PositionsService } from './services/positions.service';
import { PositionPipelinesModule } from '../position-pipelines/position-pipelines.module';
import { EmailModule } from '../email/email.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      OpenPosition, PositionLiked,
    ]),
    HttpModule,
    BaseModule,
    UserModule,
    AuthModule,
    EmailModule,
    forwardRef(() => MeetingsModule),
    forwardRef(() => PositionPipelinesModule),
    forwardRef(() => ProfilesModule),
    OpportunitiesManagersModule,
    MongooseModule.forFeature([
      {
        name: OpenPosition.name,
        schema: OpenPositionSchema,
      },
      {
        name: PositionLiked.name, schema: PositionLikedSchema
      },
    ]),
  ],
  controllers: [
    PositionsController,
    VerifiedPositionsController,
    PositionsLikedController,
  ],
  providers: [
    PositionsService,
    PositionsLikedService,
  ],
  exports: [
    PositionsService
  ]
})
export class PositionsModule { }
