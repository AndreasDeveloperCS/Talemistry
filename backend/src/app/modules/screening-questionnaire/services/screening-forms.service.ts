import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ScreeningForm, ScreeningFormDocument } from '../models/screening-form';
import { ScreeningQuestionsService } from './screening-questions.service';
import { ScreeningQuestion } from '../models/screening-question';

export interface IScreeningForm extends ScreeningForm {
    questions: ScreeningQuestion[];
}

@Injectable()
export class ScreeningFormsService extends BaseService<ScreeningForm> {

    constructor(
        @InjectModel(ScreeningForm.name)
        protected readonly model: Model<ScreeningFormDocument>,

        @InjectRepository(ScreeningForm)
        protected readonly repository: Repository<ScreeningForm>,

        protected readonly screeningQuestionsService: ScreeningQuestionsService
    ) {
        super(model, repository);
    }

    async getScreeningFormByPositionId(positionId: any, userId?: ObjectId): Promise<IScreeningForm> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const screeningForm = await this.repository.findOne({
            where: { positionId: positionIdObj },
        });

        if (!screeningForm) {
            return null;
        }

        const questions = await this.screeningQuestionsService.getByFormIdAsync(
            screeningForm._id,
        );

        const enrichedScreeningForm: IScreeningForm = {
            ...screeningForm,
            questions,
        };

        return enrichedScreeningForm;
    }

    async getScreeningFormsByPositionId(positionId: any): Promise<ScreeningForm[]> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const screeningForms = await this.repository.find({
            where: { positionId: positionIdObj },
        });

        return screeningForms;
    }
}