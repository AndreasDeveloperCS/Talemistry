import { Injectable } from '@nestjs/common';
import { PositionWorkflowStage, PositionWorkflowStageDocument } from '../models/position-workflow-stage';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PositionWorkflowStageService extends BaseService<PositionWorkflowStage> {

    constructor(
        @InjectModel(PositionWorkflowStage.name)
        protected readonly model: Model<PositionWorkflowStageDocument>,

        @InjectRepository(PositionWorkflowStage)
        protected readonly repository: Repository<PositionWorkflowStage>
    ) {
        super(model, repository);
    }
}
