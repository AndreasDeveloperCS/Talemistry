import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ScheduleDefaultSettings, ScheduleDefaultSettingsDocument } from '../model/schedule-settings';

@Injectable()
export class ScheduleDefaultSettingsService extends BaseService<ScheduleDefaultSettings> {

    constructor(
        @InjectModel(ScheduleDefaultSettings.name)
        protected readonly model: Model<ScheduleDefaultSettingsDocument>,

        @InjectRepository(ScheduleDefaultSettings)
        protected readonly repository: Repository<ScheduleDefaultSettings>
    ) {
        super(model, repository);
    }

    async getByUserIdAsync(userId: any): Promise<ScheduleDefaultSettings> {
        const item = await this.repository.findOneBy({ userId: userId });
        return item;
    }
}
