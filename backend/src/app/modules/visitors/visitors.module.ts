import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { IpExceptionsController } from './controllers/ip-exceptions.controller';
import { VisitorsController } from './controllers/visitors.controller';
import { IpException, IpExceptionSchema } from './models/ip-exception';
import { Visitor, VisitorSchema } from './models/visitor';
import { IpExceptionsService } from './services/ip-exceptions.service';
import { VisitorsService } from './services/visitors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visitor, IpException
    ]),
    MongooseModule.forFeature([
      {
        name: Visitor.name, schema: VisitorSchema
      },
      {
        name: IpException.name, schema: IpExceptionSchema
      },
    ]),
    BaseModule
  ],
  controllers: [VisitorsController, IpExceptionsController],
  providers: [VisitorsService, IpExceptionsService],
  exports: [
    VisitorsService, IpExceptionsService
  ],
})
export class VisitorsModule { }
