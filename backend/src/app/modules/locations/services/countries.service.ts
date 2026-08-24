import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { Country, CountryDocument } from '../models/countries';

@Injectable()
export class CountriesService extends BaseService<Country> {

  constructor(
    @InjectModel(Country.name)
    protected readonly model: Model<CountryDocument>,

    @InjectRepository(Country)
    protected readonly repository: Repository<Country>
  ) {
    super(model, repository);
  }
}