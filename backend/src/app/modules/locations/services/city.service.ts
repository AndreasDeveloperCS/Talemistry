import { Service } from 'typedi';
import { City, CityDocument } from '../models/city';
import { BaseService } from '../../base/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
const cities = require("all-the-cities-mongodb");

@Service()
export class CityService extends BaseService<City> {


  constructor(
    @InjectModel(City.name)
    protected readonly model: Model<CityDocument>,

    @InjectRepository(City)
    protected readonly repository: Repository<City>
  ) {
    super(model, repository);
  }

}
