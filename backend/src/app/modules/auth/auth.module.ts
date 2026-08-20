import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../common/guard';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { jwtSecret } from '../../config';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { UtilitiesService } from '../core/services/utilities.service';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/services/email.service';
import { LogModule } from '../log/log.module';
import { PermissionGuard } from '../permissions/guards/permission-guard';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserModule } from '../users/user.module';
import jwtConfig from './config/jwt.config';
import refreshJwtConfig from './config/refresh-jwt.config';
import { AuthController } from './controllers/auth.controller';
import { UserSessionController } from './controllers/user-session.controller';
import { LinkedInUser, LinkedInUserSchema } from './models/linkedin-user';
import { UserSession, UserSessionSchema } from './models/session';
import { SocialUser, SocialUserSchema } from './models/social-user';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { LinkedInAuthService } from './services/linkedin-auth.service';
import { UserSessionService } from './services/user-session.service';
import { RefreshJwtStrategy } from './strategies/refreshJwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [jwtConfig, refreshJwtConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([SocialUser, LinkedInUser, UserSession]),
    BaseModule,
    PassportModule,
    HttpModule,
    CoreModule,
    PermissionsModule,
    UserModule,
    LogModule,
    EmailModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret,
        signOptions: {
          expiresIn: '3600s'
        },
      }),
    }),
    // ConfigModule.forFeature(jwtConfig),
    // ConfigModule.forFeature(refreshJwtConfig),

    MongooseModule.forFeature([
      {
        name: SocialUser.name, schema: SocialUserSchema
      },
      {
        name: LinkedInUser.name, schema: LinkedInUserSchema
      },
      {
        name: UserSession.name, schema: UserSessionSchema
      }
    ])
  ],
  controllers: [AuthController, UserSessionController],
  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
    JwtService,
    GoogleAuthService,
    LinkedInAuthService,
    UserSessionService,
    RefreshJwtStrategy,
    UtilitiesService,
    PermissionGuard,
  ],
  exports: [
    AuthService,
    JwtModule,
    HttpModule,
    GoogleAuthService,
    LinkedInAuthService,
    UserSessionService,
    RefreshJwtStrategy,
    MongooseModule
  ],
})
export class AuthModule { }
