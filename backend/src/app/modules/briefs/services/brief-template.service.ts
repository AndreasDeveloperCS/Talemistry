import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BriefTemplate, BriefTemplateDocument } from '../models/brief-template';

@Injectable()
export class BriefTemplateService extends BaseService<BriefTemplate> {

    constructor(
        @InjectModel(BriefTemplate.name)
        protected readonly model: Model<BriefTemplateDocument>,

        @InjectRepository(BriefTemplate)
        protected readonly repository: Repository<BriefTemplate>
    ) {
        super(model, repository);
    }
}