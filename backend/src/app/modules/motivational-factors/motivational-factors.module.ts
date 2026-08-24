import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { MotivationalFactorsController } from './controllers/motivational-factors.controller';
import { MotivationalFactor, MotivationalFactorSchema } from './models/motivational-factor';
import { MotivationalFactorsService } from './services/motivational-factors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MotivationalFactor
    ]),
    MongooseModule.forFeature([
      {
        name: MotivationalFactor.name, schema: MotivationalFactorSchema
      }
    ]),
    BaseModule
  ],
  controllers: [MotivationalFactorsController],
  providers: [MotivationalFactorsService]
})
export class MotivationalFactorsModule { }
