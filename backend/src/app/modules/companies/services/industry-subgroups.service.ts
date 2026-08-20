import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { IndustrySubGroup, IndustrySubGroupDocument } from '../models/industry-subgroup';

@Injectable()
export class IndustrySubGroupService extends BaseService<IndustrySubGroup> {

    constructor(
        @InjectModel(IndustrySubGroup.name)
        protected readonly model: Model<IndustrySubGroupDocument>,

        @InjectRepository(IndustrySubGroup)
        protected readonly repository: Repository<IndustrySubGroup>
    ) {
        super(model, repository);
    }

}
