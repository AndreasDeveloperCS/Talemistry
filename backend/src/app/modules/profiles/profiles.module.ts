import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../users/user.module';
import { CustomCVController } from './controllers/custom-cv.controller';
import { CvPdfController } from './controllers/cv-pdf.controller';
import { ProfilePhotoController } from './controllers/profile-photo.controller';
import { TalentProfileController } from './controllers/talent-profile.controller';
import { VisitCardPdfController } from './controllers/visit-card-pdf.controller';
import { ProfilePhoto, ProfilePhotoSchema } from './models/profile-photo';
import { TalentProfile, TalentProfileSchema } from './models/talent-profile';
import { CustomCVService } from './services/custom-cv.service';
import { CvPdfService } from './services/cv-pdf.service';
import { ProfilePhotoService } from './services/profile-photo.service';
import { TalentProfileService } from './services/talent-profile.service';
import { VisitCardPdfService } from './services/visit-card-pdf.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([ProfilePhoto, TalentProfile]),
    MongooseModule.forFeature([
      {
        name: ProfilePhoto.name, schema: ProfilePhotoSchema
      },
      {
        name: TalentProfile.name, schema: TalentProfileSchema
      }
    ]),
    HttpModule,
    BaseModule,
    EmailModule,
    CoreModule,
    forwardRef(() => UserModule)
  ],
  controllers: [
    ProfilePhotoController,
    TalentProfileController,
    CustomCVController,
    CvPdfController,
    VisitCardPdfController
  ],
  providers: [
    TalentProfileService,
    ProfilePhotoService,
    CustomCVService,
    CvPdfService,
    VisitCardPdfService
  ],
  exports: [
    TalentProfileService,
    ProfilePhotoService
  ],
})
export class ProfilesModule { }