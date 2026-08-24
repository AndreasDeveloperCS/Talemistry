import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ObjectId } from 'bson';
import { CustomerBrief, CustomerBriefDocument } from '../models/customer-brief';

@Injectable()
export class CustomerBriefService extends BaseService<CustomerBrief> {

    constructor(
        @InjectModel(CustomerBrief.name)
        protected readonly model: Model<CustomerBriefDocument>,

        @InjectRepository(CustomerBrief)
        protected readonly repository: Repository<CustomerBrief>
    ) {
        super(model, repository);
    }

    async getByLeadIdAsync(leadId: ObjectId): Promise<CustomerBrief[]> {

        const briefs = await this.repository.find({
            where: {
                userId: leadId,
            },
        });

        console.log(briefs, 'briefs');
        return briefs;
    }
}
