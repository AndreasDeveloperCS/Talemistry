import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../base/base.module';
import { UniversityController } from './controllers/university.controller';
import { University, UniversitySchema } from './models/university';
import { UniversityService } from './services/university.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      University
    ]),
    MongooseModule.forFeature([
      {
        name: University.name, schema: UniversitySchema
      },
    ]),
    BaseModule
  ],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [
    UniversityService
  ],
})
export class UniversitiesModule { }
