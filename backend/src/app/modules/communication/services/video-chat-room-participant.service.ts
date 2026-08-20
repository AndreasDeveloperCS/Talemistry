import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { VideoChatRoomParticipant, VideoChatRoomParticipantDocument } from '../models/video-chat-room-participant';
import { ObjectId } from 'bson';

@Injectable()
export class VideoChatRoomParticipantService extends BaseService<VideoChatRoomParticipant> {

    constructor(
        @InjectModel(VideoChatRoomParticipant.name)
        protected readonly model: Model<VideoChatRoomParticipantDocument>,

        @InjectRepository(VideoChatRoomParticipant)
        protected readonly repository: Repository<VideoChatRoomParticipant>,
    ) {
        super(model, repository);
    }

    public async getByUserIdAsync(userId: any): Promise<VideoChatRoomParticipant[] | null> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const chatRooms = await this.repository.find({
            where: { userId: userIdObj },
        });

        return chatRooms;
    }

    public async findAsync(filter: any = {}): Promise<VideoChatRoomParticipant[]> {
        return await this.repository.find(filter);
    }

    async deleteAllByRoomId(roomId: any): Promise<any> {
        const roomIdObj = typeof roomId === 'string' ? new ObjectId(roomId) : roomId;
        console.log('Deleting participants for roomId:', roomIdObj);
        return this.model.deleteMany({ videoChatRoomId: roomIdObj }).exec();
    }
}