import { Injectable } from '@nestjs/common';
import { InterviewFeedbackDetails, InterviewFeedbackDetailsDocument } from '../models/interview-feedback-details';
import { BaseService } from '../../base/services/base.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class InterviewFeedbackDetailsService extends BaseService<InterviewFeedbackDetails> {

    constructor(
        @InjectModel(InterviewFeedbackDetails.name)
        protected readonly model: Model<InterviewFeedbackDetailsDocument>,
    
        @InjectRepository(InterviewFeedbackDetails)
        protected readonly repository: Repository<InterviewFeedbackDetails>
    ) {
        super(model, repository);
    }
}
