import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { Currency, CurrencyDocument } from '../models/currency';

@Injectable()
export class CurrenciesService extends BaseService<Currency> {

  constructor(
    @InjectModel(Currency.name)
    protected readonly model: Model<CurrencyDocument>,

    @InjectRepository(Currency)
    protected readonly repository: Repository<Currency>
  ) {
    super(model, repository);
  }

  async bulkUpdate(updatingQuery: any) {
    console.log('bulkUpdate', updatingQuery);
    await this.model.updateMany({}, { $set: updatingQuery })
  }
}