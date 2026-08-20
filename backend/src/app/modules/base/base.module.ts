import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { EmptyModel, EmptySchema } from './models/empty-model';
import { AWSFileShareService } from './services/aws-fileshare.service';
import { BaseService } from './services/base.service';
import { S3Service } from './services/s3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      EmptyModel
    ]),
    HttpModule,
    MongooseModule.forFeature([
      {
        name: EmptyModel.name,
        schema: EmptySchema,
      },
      // {
      //   name: BlogPostComment.name,
      //   schema: BlogPostCommentSchema,
      // }
    ]),
  ],

  providers: [
    AWSFileShareService,
    S3Service,
    {
      provide: BaseService,
      useFactory: (genericModel: Model<any>, genericRepository: Repository<any>) => {
        return new BaseService(genericModel, genericRepository);
      },
      //inject: ['ModelRepository'],
    },
  ],

  controllers: [],
  exports: [BaseService, AWSFileShareService, S3Service],

})
export class BaseModule { }
