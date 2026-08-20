import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { CertificationController } from './controllers/certification.controller';
import { EducationController } from './controllers/education.controller';
import { SkillsController } from './controllers/skills.controller';
import { CertificationSchema } from './models/certification';
import { Education, EducationSchema } from './models/education';
import { Certification, Skill, SkillSchema } from './models/skill';
import { CertificationService } from './services/certification.service';
import { EducationService } from './services/education.service';
import { SkillsService } from './services/skills.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Skill, Education, Certification
    ]),
    MongooseModule.forFeature([
      {
        name: Skill.name, schema: SkillSchema
      },
      {
        name: Education.name, schema: EducationSchema
      },
      {
        name: Certification.name, schema: CertificationSchema
      }
    ]),
    BaseModule
  ],
  controllers: [SkillsController, CertificationController, EducationController],
  providers: [SkillsService, CertificationService, EducationService],
  exports: [
    SkillsService, CertificationService, EducationService
  ],
})
export class SkillsModule { }
