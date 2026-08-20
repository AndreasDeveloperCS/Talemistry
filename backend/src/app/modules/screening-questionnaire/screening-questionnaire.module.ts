import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { ScreeningFormsController } from './controllers/screening-forms.controller';
import { ScreeningQuestionsController } from './controllers/screening-questions.controller';
import { ScreeningResponsesController } from './controllers/screening-responses.controller';
import { ScreeningForm, ScreeningFormSchema } from './models/screening-form';
import { ScreeningQuestion, ScreeningQuestionSchema } from './models/screening-question';
import { ScreeningResponse, ScreeningResponseSchema } from './models/screening-response';
import { ScreeningFormsService } from './services/screening-forms.service';
import { ScreeningQuestionsService } from './services/screening-questions.service';
import { ScreeningResponsesService } from './services/screening-responses.service';
import { ScreeningQuestionTemplate, ScreeningQuestionTemplateSchema } from './models/screening-question-template';
import { ScreeningQuestionTemplatesController } from './controllers/screening-question-templates.controller';
import { ScreeningQuestionTemplatesService } from './services/screening-question-templates.service';
import { PositionsModule } from '../positions/positions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScreeningQuestion,
      ScreeningForm,
      ScreeningResponse,
      ScreeningQuestionTemplate,
    ]),
    MongooseModule.forFeature([
      {
        name: ScreeningQuestion.name, schema: ScreeningQuestionSchema
      },
      {
        name: ScreeningForm.name, schema: ScreeningFormSchema
      },
      {
        name: ScreeningResponse.name, schema: ScreeningResponseSchema
      },
      {
        name: ScreeningQuestionTemplate.name, schema: ScreeningQuestionTemplateSchema
      },
    ]),
    BaseModule,
    PositionsModule,
  ],
  controllers: [
    ScreeningFormsController,
    ScreeningQuestionsController,
    ScreeningResponsesController,
    ScreeningQuestionTemplatesController,
  ],
  providers: [
    ScreeningFormsService,
    ScreeningQuestionsService,
    ScreeningResponsesService,
    ScreeningQuestionTemplatesService,
  ]
})
export class ScreeningQuestionnaireModule { }
