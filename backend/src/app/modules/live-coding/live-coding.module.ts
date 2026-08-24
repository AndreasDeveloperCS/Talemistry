import { Module } from '@nestjs/common';
import { LiveCodingGateway } from './gateways/live-coding.gateway';
import { LiveCodingService } from './services/live-coding.service';
import { BaseModule } from '../base/base.module';
import { UserModule } from '../users/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios/dist/http.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AuthModule } from '../auth/auth.module';
import { CodeExecutionService } from './services/code-execution.service';
import { LiveCodingSession, LiveCodingSessionSchema } from './models/live-coding-session.model';
import { LiveCodingSessionService } from './services/live-coding-session.service';
import { LiveCodingSessionController } from './controllers/live-coding-sessions.controller';
import { CodeSnippet, CodeSnippetSchema } from './models/code-snippet.model';
import { CodeSnippetController } from './controllers/code-snippets.controller';
import { CodeSnippetService } from './services/code-snippets.service';
import { CodeSnippetsGeneratorService } from './services/code-snippets-generator.service';
import { SqlExecutionService } from './services/sql-execution-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveCodingSession,
      CodeSnippet,
    ]),
    MongooseModule.forFeature([
      {
        name: LiveCodingSession.name, schema: LiveCodingSessionSchema
      },
      {
        name: CodeSnippet.name, schema: CodeSnippetSchema
      },
    ]),
    HttpModule,
    BaseModule,
    AuthModule,
    UserModule
  ],
  controllers: [
    LiveCodingSessionController,
    CodeSnippetController,
  ],
  providers: [
    LiveCodingGateway,
    LiveCodingService,
    CodeExecutionService,
    LiveCodingSessionService,
    CodeSnippetService,
    CodeSnippetsGeneratorService,
    SqlExecutionService,
  ],
})
export class LiveCodingModule {}