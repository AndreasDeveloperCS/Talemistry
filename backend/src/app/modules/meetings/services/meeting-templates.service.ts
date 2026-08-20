import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { MeetingTemplate, MeetingTemplateDocument } from '../model/meeting-template';

@Injectable()
export class MeetingTemplatesService extends BaseService<MeetingTemplate> {
    
     constructor(
            @InjectModel(MeetingTemplate.name)
            protected readonly model: Model<MeetingTemplateDocument>,
        
            @InjectRepository(MeetingTemplate)
            protected readonly repository: Repository<MeetingTemplate>
        
    ) {
        super(model, repository);
    }

    async getByPositionId(positionId: any): Promise<MeetingTemplate[]> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const screeningForms = await this.repository.find({
            where: { positionId: positionIdObj },
        });
        console.log('getMeetingTemplatesByPositionId', screeningForms);

        return screeningForms;
    }
}