import { BaseEntity } from "../../general/models/base-entity";

export interface IVideoChatParticipant {
    name?: any,
    email: any,
    userId?: any,
    role?: string,
    videoChatRoomId: any,
    joinedAt?: Date,
}

export class VideoChatRoomParticipant implements BaseEntity, IVideoChatParticipant {
    _id?: any;
    name?: string;
    email: string = '';
    role?: string;
    videoChatRoomId: any;
    userId?: any;
    isVerified: boolean = true;
    joinedAt?: Date = new Date();
    createdBy?: any;
    createdDate: Date = new Date();
}