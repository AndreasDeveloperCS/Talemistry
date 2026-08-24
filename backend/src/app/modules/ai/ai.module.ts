import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { EmptyModel, EmptySchema } from '../base/models/empty-model';
import { ChatGptController } from './controllers/chat-gpt.controller';
import { GeminiController } from './controllers/gemini.controller';
import { ChatGptService } from './services/chat-gpt.service';
import { GeminiService } from './services/gemini.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      EmptyModel
    ]),
    HttpModule,
    BaseModule,
    MongooseModule.forFeature([
      {
        name: EmptyModel.name,
        schema: EmptySchema,
      }
    ]),
  ],
  controllers: [GeminiController, ChatGptController],
  providers: [GeminiService, ChatGptService],
  exports: [GeminiService, ChatGptService]
})
export class AiModuleModule { }