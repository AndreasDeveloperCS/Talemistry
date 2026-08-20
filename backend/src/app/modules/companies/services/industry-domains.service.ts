import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { IndustryDomain, IndustryDomainDocument } from '../models/industry';

@Injectable()
export class IndustryDomainsService extends BaseService<IndustryDomain> {

    constructor(
        @InjectModel(IndustryDomain.name)
        protected readonly model: Model<IndustryDomainDocument>,

        @InjectRepository(IndustryDomain)
        protected readonly repository: Repository<IndustryDomain>
    ) {
        super(model, repository);
    }

}
