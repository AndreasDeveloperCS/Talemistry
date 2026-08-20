import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { ScreeningQuestion, ScreeningQuestionDocument } from '../models/screening-question';
import { ObjectId } from 'bson';

@Injectable()
export class ScreeningQuestionsService extends BaseService<ScreeningQuestion> {

    constructor(
        @InjectModel(ScreeningQuestion.name)
        protected readonly model: Model<ScreeningQuestionDocument>,

        @InjectRepository(ScreeningQuestion)
        protected readonly repository: Repository<ScreeningQuestion>
    ) {
        super(model, repository);
    }

    async getByFormIdAsync(formId: ObjectId): Promise<ScreeningQuestion[]> {
        return this.repository.find({ where: { formId: formId } });
    }

    async getAllQuestionsAsync(): Promise<ScreeningQuestion[]> {
        return this.repository.find();
    }

    async deleteAllQuestions(userId: any): Promise<any> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        console.log('userIdObj', userIdObj);
        return this.model.deleteMany({});
    }
}