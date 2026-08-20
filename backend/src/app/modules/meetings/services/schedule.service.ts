import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { ScheduleTimeFrame, ScheduleTimeFrameDocument } from '../model/schedule-timeframes';

@Injectable()
export class ScheduleService extends BaseService<ScheduleTimeFrame> {

    constructor(
        @InjectModel(ScheduleTimeFrame.name)
        protected readonly model: Model<ScheduleTimeFrameDocument>,

        @InjectRepository(ScheduleTimeFrame)
        protected readonly repository: Repository<ScheduleTimeFrame>
    ) {
        super(model, repository);
    }

}
