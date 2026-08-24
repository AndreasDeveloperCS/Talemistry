import { Injectable } from '@nestjs/common';
import { PositionWorkflow, PositionWorkflowDocument } from '../models/position-workflow';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PositionWorkflowService extends BaseService<PositionWorkflow> {

    constructor(
        @InjectModel(PositionWorkflow.name)
        protected readonly model: Model<PositionWorkflowDocument>,

        @InjectRepository(PositionWorkflow)
        protected readonly repository: Repository<PositionWorkflow>,
    ) {
        super(model, repository);
    }

    async getByPositionId(positionId: any): Promise<PositionWorkflow | any> {
        return this.repository.findOne({
            where: { positionId },
        });
    }
}
