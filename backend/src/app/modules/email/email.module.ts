import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { CoreModule } from '../core/core.module';
import { EmailController } from './controllers/email.controller';
import { EmailMessage, EmailMessageSchema } from './models/message';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      EmailMessage,
    ]),
    HttpModule,
    BaseModule,
    CoreModule,
    MongooseModule.forFeature([
      {
        name: EmailMessage.name,
        schema: EmailMessageSchema,
      },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService, MongooseModule, TypeOrmModule],
})
export class EmailModule { }
