import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { EmailModule } from '../email/email.module';
import { BulkGateService } from './services/bulkgate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    MongooseModule.forFeature([
      //   {
      //     name: IndustrySubGroup.name, schema: IndustrySubGroupSchema
      //   },
    ]),
    HttpModule,
    BaseModule,
    EmailModule,
  ],
  controllers: [

  ],
  providers: [
    BulkGateService,
  ],
  exports: [
    BulkGateService,
  ]
})
export class BulkgateModule { }