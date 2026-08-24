
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BriefTemplate } from '../models/brief-template';
import { BriefSectionTemplate, BriefSectionTemplateDocument } from '../models/brief-template-section';

@Injectable()
export class BriefSectionTemplateService extends BaseService<BriefSectionTemplate> {

    constructor(
        @InjectModel(BriefSectionTemplate.name)
        protected readonly model: Model<BriefSectionTemplateDocument>,

        @InjectRepository(BriefTemplate)
        protected readonly repository: Repository<BriefSectionTemplate>
    ) {
        super(model, repository);
    }
}