import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { Lead, LeadDocument } from '../models/lead';

@Injectable()
export class LeadsService extends BaseService<Lead> {

    constructor(
        @InjectModel(Lead.name)
        protected readonly model: Model<LeadDocument>,

        @InjectRepository(Lead)
        protected readonly repository: Repository<Lead>
    ) {
        super(model, repository);
    }
}
