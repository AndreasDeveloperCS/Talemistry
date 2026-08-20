import { ObjectId } from "mongoose";
import { ChatRoomType } from "./chat-room";
import { ChatMessage } from "./chat-message";

export interface ChatMessagePayload {
  _id: ObjectId;
  from: string;
  text: string;
  msgId?: string;
  meta?: any;
  sentAt: number;
}

export interface IContact {
  contactId: string;
  contactName?: string;
  positionId?: string;
  roomId?: string;
  roomName?: string;
  email?: string;
  phone?: string;
  username?: string;
  role?: string;
  photoUrl?: string;
  lastReadMessageId?: string
  lastMessageText?: string;
  lastMessageDate?: Date;
  lastMessageStatus?: any;
  unreadCount?: number;
}

export interface IOpenPosition {
  positionId: string;
  positionName: string;
}

export interface IChatRoomSummary {
  _id: string;
  type: ChatRoomType;
  name?: string;
  participants: IContact[];
  positionId?: string;

  lastMessageText?: string;
  lastMessageDate?: Date;
  unreadCount?: number;
  lastMessageStatus?: 'delivered' | 'read' | null;
}

export interface IChatMessageResponse extends ChatMessage {
  senderName?: string;
  senderPhotoUrl?: string;
}