import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { SocialMedia, SocialMediaSchema } from './models/social-media';
import { UserSocialMedia, UserSocialMediaSchema } from './models/user-social-media';
import { SocialMediaController } from './controllers/social-media.controller';
import { UserSocialMediaController } from './controllers/user-social-media.controller';
import { SocialMediaIcon, SocialMediaIconSchema } from './models/social-media-icon';
import { SocialMediaIconService } from './services/social-media-icon.service';
import { UserSocialMediaService } from './services/user-social-media.service';
import { SocialMediaService } from './services/social-media.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      SocialMedia,
      UserSocialMedia,
      SocialMediaIcon,
    ]),
    HttpModule,
    BaseModule,
    MongooseModule.forFeature([
      {
        name: SocialMedia.name,
        schema: SocialMediaSchema,
      },
      {
        name: UserSocialMedia.name,
        schema: UserSocialMediaSchema,
      },
      {
        name: SocialMediaIcon.name,
        schema: SocialMediaIconSchema,
      }
    ]),
  ],
  controllers: [
    SocialMediaController,
    UserSocialMediaController
  ],
  providers: [
    SocialMediaService,
    UserSocialMediaService,
    SocialMediaIconService
  ]
})
export class SocialMediaModule { }
