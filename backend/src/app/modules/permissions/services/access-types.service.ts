import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { AccessType, AccessTypeDocument } from '../models/access-type';

@Injectable()
export class AccessTypesService extends BaseService<AccessType> {

    constructor(
        @InjectModel(AccessType.name)
        protected readonly model: Model<AccessTypeDocument>,

        @InjectRepository(AccessType)
        protected readonly repository: Repository<AccessType>

    ) {
        super(model, repository);
    }

    async getMaxRegisterValue(): Promise<number> {
        const maxRole = await this.model.findOne().sort({ registerValue: -1 }).exec();
        return maxRole?.registerValue ?? 0;
    }

    async getAll(): Promise<AccessType[]> {
        return this.model.find().exec();
    }
}