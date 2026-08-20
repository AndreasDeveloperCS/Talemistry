import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../users/user.module';
import { BriefQuestionTemplateController } from './controllers/brief-question.controller';
import { BriefSectionTemplateController } from './controllers/brief-section-template.controller';
import { BriefTemplateController } from './controllers/brief-template.controller';
import { CustomerBriefController } from './controllers/customer-brief.controller';
import { LeadsController } from './controllers/leads.controller';
import { BriefCustomerSection } from './models/brief-customer-section';
import { BriefQuestion, BriefQuestionSchema } from './models/brief-question';
import { BriefTemplate, BriefTemplateSchema } from './models/brief-template';
import { BriefSectionTemplate, BriefSectionTemplateSchema } from './models/brief-template-section';
import { CustomerBrief, CustomerBriefSchema } from './models/customer-brief';
import { Lead, LeadSchema } from './models/lead';
import { BriefQuestionService } from './services/brief-question.service';
import { BriefSectionTemplateService } from './services/brief-section.service';
import { BriefTemplateService } from './services/brief-template.service';
import { CustomerBriefService } from './services/customer-brief.service';
import { LeadsService } from './services/leads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead, CustomerBrief, BriefTemplate, BriefCustomerSection, BriefSectionTemplate, BriefQuestion
    ]),
    MongooseModule.forFeature([
      {
        name: Lead.name, schema: LeadSchema
      },
      {
        name: BriefQuestion.name, schema: BriefQuestionSchema
      },
      {
        name: BriefSectionTemplate.name, schema: BriefSectionTemplateSchema
      },
      {
        name: BriefTemplate.name, schema: BriefTemplateSchema
      },
      {
        name: CustomerBrief.name, schema: CustomerBriefSchema
      },
    ]),
    BaseModule,
    UserModule,
    EmailModule,
  ],
  controllers: [LeadsController, CustomerBriefController, BriefTemplateController, BriefSectionTemplateController, BriefQuestionTemplateController],
  providers: [CustomerBriefService, BriefTemplateService, BriefSectionTemplateService, BriefQuestionService, LeadsService, JwtService]
})
export class BriefsModule { }
