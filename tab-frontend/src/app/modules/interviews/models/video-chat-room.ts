import { BaseEntity, OwnerEntity } from "../../general/models/base-entity";
import { IVideoChatParticipant } from "./video-chat-room-participant";

export enum VideoChatRoomType {
    DIRECT = "direct",
    GROUP = "group",
    SELF = "self",
    STAGE = "stage"
}

export interface IChatRoom {
    name: string;
    type: VideoChatRoomType,
    positionId?: any,
    pipelineStageId?: any,
    participants: IVideoChatParticipant[]
}

export interface IVideoChatRoom {
    name?: string,
    type: VideoChatRoomType
    participants?: IVideoChatParticipant[],
    joinToken?: string,
    isOpenMeeting?: boolean,
    isDefault?: boolean
}

export class VideoChatRoom implements BaseEntity, IVideoChatRoom, OwnerEntity {
    _id?: any;
    name?: string;
    type: VideoChatRoomType = VideoChatRoomType.DIRECT;
    participants: IVideoChatParticipant[] = [];
    joinToken?: string;
    isOpenMeeting?: boolean;
    isDefault?: boolean;
    isVerified: boolean = true;
    userId: any;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}

export interface IEnrichedVideoChatRoom extends VideoChatRoom {
    participants: IVideoChatParticipant[];
}