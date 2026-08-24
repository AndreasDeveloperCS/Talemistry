import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { Model } from 'mongoose';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { Meeting, MeetingDocument } from '../model/meeting';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'bson';

@Injectable()
export class MeetingsService extends BaseService<Meeting> {
    
     constructor(
            @InjectModel(Meeting.name)
            protected readonly model: Model<MeetingDocument>,
        
            @InjectRepository(Meeting)
            protected readonly repository: Repository<Meeting>
        
    ) {
        super(model, repository);
    }

    async getMeetingsByRangeAsync(email: any, startDate: Date, endDate: Date): Promise<Meeting[] | null> {
        if (!email || !startDate || !endDate) {
            console.error('getMeetingsByRangeAsync: Missing parameters');
            return null;
        }

        const startUTC = new Date(Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth(),
            startDate.getUTCDate(),
            startDate.getUTCHours(),
            startDate.getUTCMinutes(),
            startDate.getUTCSeconds(),
            0
        ));

        const endUTC = new Date(Date.UTC(
            endDate.getUTCFullYear(),
            endDate.getUTCMonth(),
            endDate.getUTCDate(),
            endDate.getUTCHours(),
            endDate.getUTCMinutes(),
            endDate.getUTCSeconds(),
            999
        ));

        console.log('Fetching meetings for:', startUTC, '→', endUTC);

        return await this.model.find({
            'participants.email': email,
            startTime: { $gte: startUTC, $lte: endUTC }
        }).exec();
    }

    async getMeetingsByDateAsync(email: any, selectedDate: Date): Promise<Meeting[] | null> {
        const date = new Date(selectedDate);
        date.setDate(date.getDate());

        const startOfDay = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0, 0, 0, 0
        ));

        const endOfDay = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            23, 59, 59, 999
        ));

        console.log('Checking meetings for:', startOfDay, '->', endOfDay);

        return await this.model.find({
            'participants.email': email,
            startTime: { $gte: startOfDay, $lte: endOfDay }
        }).exec();
    }

    async getUpcomingMeetingsByEmailAsync(email: any, date: any): Promise<Meeting[] | null> {
        const now = new Date(date);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        console.log('getMeetingsByUserIdAsync', email, 'from:', startOfMonth);

        return await this.model.find({
            'participants.email': email,
            startTime: { $gte: startOfMonth }   
        }).exec();
    }

    async countMeetingsByEmailAndRange(
        email: string,
        from?: Date,
        to?: Date
    ): Promise<number> {

        const query: any = {
            'participants.email': email
        };

        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = from;
            if (to) query.startTime.$lt = to;
        }

        return this.model.countDocuments(query).exec();
    }
}
