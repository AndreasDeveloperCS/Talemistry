import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { AuthModule } from '../auth/auth.module';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { EmailModule } from '../email/email.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { SkillsModule } from '../skills/skills.module';
import { UserModule } from '../users/user.module';
import { CoverLetterController } from './controllers/cover-letter.controller';
import { CvsController } from './controllers/cvs.controller';
import { CoverLetter, CoverLetterSchema } from './models/cover-letter-info';
import { InfoCvDto, InfoCvSchema } from './models/info-cv';
import { PositionApplied, PositionAppliedSchema } from './models/positions-applied';
import { CoverLetterService } from './services/cover-letter.service';
import { CvsService } from './services/cvs.service';
import { OpenAIHelperService } from './services/open-ai.service';
import { PositionAppliedService } from './services/positions-applied.service';
import { ResumeParserService } from './services/resume-parser.service';
import { CVParserGateway } from './gateways/cv-parser.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InfoCvDto, CoverLetter, PositionApplied
    ]),
    MongooseModule.forFeature([
      {
        name: InfoCvDto.name, schema: InfoCvSchema
      },
      {
        name: CoverLetter.name, schema: CoverLetterSchema
      },
      {
        name: PositionApplied.name, schema: PositionAppliedSchema
      }
    ]),
    BaseModule,
    EmailModule,
    AuthModule,
    UserModule,
    SkillsModule,
    CoreModule,
    ProfilesModule
  ],
  controllers: [
    CvsController, 
    CoverLetterController
  ],
  providers: [
    CvsService, 
    CoverLetterService, 
    PositionAppliedService, 
    ResumeParserService,
    OpenAIHelperService,
    CVParserGateway,
  ],
  exports: [
    CvsService, 
    CoverLetterService, 
    PositionAppliedService, 
    ResumeParserService,
    CVParserGateway,
  ],
})
export class CvsModule { }
