import { BaseEntity, OwnerEntity } from "../../general/models/base-entity";

export interface IChatMessage {
  roomId: any,
  positionId?: any,
  senderId: any,
  content: string,
  type: MessageType,
  status: IMessageStatus,
  meta?: Record<string, any>,
}

export interface IMessageStatus {
  deliveredTo: IMessageDelivery[];
  readBy: IMessageRead[];
}

export interface IMessageDelivery {
  userId: string;
  deliveredAt: Date;
}

export interface IMessageRead {
  userId: string;
  readAt: Date;
}

export enum MessageType {
  TEXT = "text",
  FILE = "file",
  SYSTEM = "system"
}

export class ChatMessage implements BaseEntity, OwnerEntity, IChatMessage {
  _id?: any;
  roomId: any;
  positionId?: any;
  senderId: any;
  content: string = '';
  type: MessageType = MessageType.TEXT;
  status: IMessageStatus = { deliveredTo: [], readBy: [] };
  meta?: Record<string, any>;
  userId: any;
  createdBy?: any;
  createdDate: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date;
}

export interface PendingContact {
  contactId: any;
  pseudonym: string;
}