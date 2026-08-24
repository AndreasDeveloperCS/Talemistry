import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { EmailModule } from '../email/email.module';
import { LogController } from './controllers/log.controller';
import { LogRecord, LogRecordSchema } from './models/log-record';
import { LogService } from './services/log-service';

@Module({
    imports: [
        ConfigModule.forRoot({
            expandVariables: true,
        }),
        TypeOrmModule.forFeature([
            LogRecord,
        ]),
        HttpModule,
        BaseModule,
        EmailModule,
        MongooseModule.forFeature([
            {
                name: LogRecord.name,
                schema: LogRecordSchema,
            },
        ]),
    ],
    controllers: [LogController],
    providers: [LogService],
    exports: [LogService],
})
export class LogModule { }
