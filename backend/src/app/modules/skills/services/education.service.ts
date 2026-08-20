import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Education, EducationDocument } from '../models/education';

@Injectable()
export class EducationService extends BaseService<Education>{

    constructor(
      @InjectModel(Education.name)
      protected readonly model: Model<EducationDocument>,
  
      @InjectRepository(Education)
      protected readonly repository: Repository<Education>
    ) {
      super(model, repository);
    }
    
}