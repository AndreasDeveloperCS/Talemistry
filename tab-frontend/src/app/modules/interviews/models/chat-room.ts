import { BaseEntity, OwnerEntity } from "../../general/models/base-entity"

export enum ChatRoomType {
    DIRECT = "direct",
    GROUP = "group",
    SELF = "self"
}
export enum ParticipantRole {
    RECRUITER = "recruiter",
    INTERVIEWER = "interviewer",
    TALENT = "talent",
    MANAGER = "manager",
    ADMIN = "admin"
}
export interface IParticipant {
    userId: any,
    email?: string,
    role?: ParticipantRole,
    joinedAt?: Date,
    contactId?: any,
    contactName?: string,
    lastReadMessageId?: any,
    photoUrl?: any
}

export interface IChatRoom {

    type: ChatRoomType,
    name?: string,
    positionId?: any,
    participants: IParticipant[]
}

export class ChatRoom implements BaseEntity, IChatRoom, OwnerEntity {
    _id?: any;
    type: ChatRoomType = ChatRoomType.DIRECT;
    name?: string;
    positionId?: any;
    participants: IParticipant[] = [];
    lastReadMessageId?: string;
    lastMessageText?: string;
    lastMessageDate?: Date;
    unreadCount?: number; 
    lastMessageStatus?: any;
    userId: any;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}