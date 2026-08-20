import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { MotivationalFactorsController } from './controllers/position-benefits.controller';
import { PositionBenefit, PositionBenefitSchema } from './models/position-benefit';
import { PositionBenefitsService } from './services/position-benefits.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PositionBenefit
    ]),

    MongooseModule.forFeature([
      {
        name: PositionBenefit.name, schema: PositionBenefitSchema
      }
    ]),
    BaseModule
  ],
  controllers: [MotivationalFactorsController],
  providers: [PositionBenefitsService]
})
export class PositionBenefitsModule { }
