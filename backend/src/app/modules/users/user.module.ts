import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user';
import { UserController } from './controllers/user.controller';
import { UsersService } from './services/user.service';
import { VerificationRequest, VerificationRequestSchema } from './models/user-verification';
import { VerificationService } from './services/verification.service';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../../config';
import { JwtStrategy } from '../../common/guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfilesController } from './controllers/user-profiles.controller';
import { UserCredentialsController } from './controllers/user-credentials.controller';
import { VerificationRequestsController } from './controllers/email-verification.controller';
import { EmailModule } from '../email/email.module';
import { PermissionsService } from '../permissions/services/permissions.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { CoreModule } from '../core/core.module';
import { PermissionGuard } from '../permissions/guards/permission-guard';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { ProfilesModule } from '../profiles/profiles.module';


@Module({
  imports: [
    PermissionsModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret,
        signOptions: {
          expiresIn: '3600s'
        },
      }),
    }),
    TypeOrmModule.forFeature([User, VerificationRequest]),
    MongooseModule.forFeature([
      {
        name: User.name, schema: UserSchema
      },
      {
        name: VerificationRequest.name, schema: VerificationRequestSchema
      }
    ]),
    EmailModule,
    CoreModule,
    forwardRef(() => ProfilesModule)
  ],
  controllers: [UserController, VerificationRequestsController, UserProfilesController, UserCredentialsController],
  providers: [UsersService, VerificationService, JwtService, JwtStrategy, PermissionsService, PermissionGuard],
  exports: [UsersService, VerificationService],
})
export class UserModule { }
