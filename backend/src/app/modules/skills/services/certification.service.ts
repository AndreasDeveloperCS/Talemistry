import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Certification, CertificationDocument } from '../models/certification';

@Injectable()
export class CertificationService extends BaseService<Certification>{

    constructor(
      @InjectModel(Certification.name)
      protected readonly model: Model<CertificationDocument>,
  
      @InjectRepository(Certification)
      protected readonly repository: Repository<Certification>
    ) {
      super(model, repository);
    }
    
}