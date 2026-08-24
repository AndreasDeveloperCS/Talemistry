import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { PipelineStageFeedback, PipelineStageFeedbackDocument } from '../models/pipeline-stage-feedback';
import { ObjectId } from 'bson';

@Injectable()
export class PipelineStageFeedbacksService extends BaseService<PipelineStageFeedback> {

    constructor(
        @InjectModel(PipelineStageFeedback.name)
        protected readonly model: Model<PipelineStageFeedbackDocument>,
    
        @InjectRepository(PipelineStageFeedback)
        protected readonly repository: Repository<PipelineStageFeedback>
    ) {
        super(model, repository);
    }

    async getFeedbackByPipelineProgressId(pipelineProgressId: any, userId: any): Promise<PipelineStageFeedback[]> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const pipelineProgressIdObj = typeof pipelineProgressId === 'string' ? new ObjectId(pipelineProgressId) : pipelineProgressId;

        const feedback = await this.repository.find({
            where: { 
                pipelineProgressId: pipelineProgressIdObj, 
                //userId: userIdObj 
            },
        });
        console.log('getFeedbackByPipelineProgressIdAsync', feedback);

        return feedback;
    }
}