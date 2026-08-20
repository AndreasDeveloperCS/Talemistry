import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ScreeningResponse, ScreeningResponseDocument } from '../models/screening-response';
import { ScreeningFormsService } from './screening-forms.service';

@Injectable()
export class ScreeningResponsesService extends BaseService<ScreeningResponse> {

    constructor(
        @InjectModel(ScreeningResponse.name)
        protected readonly model: Model<ScreeningResponseDocument>,

        @InjectRepository(ScreeningResponse)
        protected readonly repository: Repository<ScreeningResponse>,
        protected screeningFormService: ScreeningFormsService
    ) {
        super(model, repository);
    }

    async getByFormIdAsync(formId: any): Promise<ScreeningResponse> {
        const formIdObj = typeof formId === 'string' ? new ObjectId(formId) : formId;

        const screeningResponse = await this.repository.findOne({
            where: { formId: formIdObj },
        });
        console.log('getByFormIdAsync', screeningResponse);

        return screeningResponse;
    }

    async getByTalentIdAsync(talentId: any): Promise<ScreeningResponse> {
        const talentIdObj = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;

        const screeningResponse = await this.repository.findOne({
            where: { talentId: talentIdObj },
        });
        console.log('getByTalentIdAsync', screeningResponse);

        return screeningResponse;
    }

    async getByPositionIdAsync(positionId: any): Promise<ScreeningResponse> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const screeningResponse = await this.repository.findOne({
            where: { positionId: positionIdObj },
        });
        console.log('getByPositionIdAsync', screeningResponse);

        return screeningResponse;
    }

    async getByPositionIdTalentIdAsync(positionId: any, talentId: any): Promise<ScreeningResponse> {
        const talentIdObj = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;
        const form = await this.screeningFormService.getScreeningFormByPositionId(positionId);
        if(!form) {
            return null;
        }

        const screeningResponse = await this.repository.findOne({
            where: { formId: form._id, talentId: talentIdObj },
        });
        console.log('getByPositionIdTalentIdAsync', screeningResponse);

        return screeningResponse;
    }
    
    async getAllByFormIdAsync(formId: any): Promise<ScreeningResponse[]> {
        const formIdObj = typeof formId === 'string' ? new ObjectId(formId) : formId;

        const screeningResponses = await this.repository.find({
            where: { formId: formIdObj },
        });
        console.log('getAllByFormIdAsync', screeningResponses);

        return screeningResponses;
    }
}