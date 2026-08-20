import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Manager, ManagerDocument } from '../models/manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';

@Injectable()
export class OpportunitiesManagersService extends BaseService<Manager> {
    constructor(
        @InjectModel(Manager.name)
        protected readonly model: Model<ManagerDocument>,
        @InjectRepository(Manager)
        protected readonly repository: Repository<Manager>
    ) {
        super(model, repository);
    }
}
