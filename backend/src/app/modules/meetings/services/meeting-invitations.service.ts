import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { MeetingInvitation, MeetingInvitationDocument } from '../model/meeting-invitation';
import { ObjectId } from 'bson';

@Injectable()
export class MeetingInvitationsService extends BaseService<MeetingInvitation> {
    
     constructor(
            @InjectModel(MeetingInvitation.name)
            protected readonly model: Model<MeetingInvitationDocument>,
        
            @InjectRepository(MeetingInvitation)
            protected readonly repository: Repository<MeetingInvitation>
        
    ) {
        super(model, repository);
    }

    async getByPositionId(positionId: any): Promise<MeetingInvitation[]> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const meetingInvitations = await this.repository.find({
            where: { positionId: positionIdObj },
        });
        console.log('getMeetingInvitationsByPositionId', meetingInvitations);

        return meetingInvitations;
    }

    async getByPositionIdTalentId(positionId: any, talentId: any): Promise<MeetingInvitation | null> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;
        const talentIdObj = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;

        const meetingInvitation = await this.repository.findOne({
            where: { positionId: positionIdObj, talentId: talentIdObj },
        });
        console.log('getByPositionIdTalentId', meetingInvitation);

        return meetingInvitation;
    }

    async getByBookingToken(bookingToken: string): Promise<MeetingInvitation | null> {
        const meetingInvitation = await this.repository.findOne({
            where: { bookingToken }
        });
        console.log('getMeetingInvitationsByBookingToken', meetingInvitation);

        return meetingInvitation;
    }
}