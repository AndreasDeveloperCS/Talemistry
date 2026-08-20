import { Injectable } from '@nestjs/common';
import { InfoCvSchema, InfoCvDocument, InfoCvDto } from '../models/info-cv';
import { BaseService } from '../../base/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { PositionApplied, PositionAppliedDocument } from '../models/positions-applied';

@Injectable()
export class PositionAppliedService extends BaseService<PositionApplied> { 
   
      constructor(
        @InjectModel(PositionApplied.name)
        protected readonly model: Model<PositionAppliedDocument>,
    
        @InjectRepository(PositionApplied)
        protected readonly repository: Repository<PositionApplied>
    
      ) {
        super(model, repository);
      }

}
