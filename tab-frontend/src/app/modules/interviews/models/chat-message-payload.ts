import { ChatMessage } from "./chat-message";
import { ChatRoomType } from "./chat-room";
import { CommunicationMean } from "./communication-mean";
import { NotificationTemplate } from "../../pipeline-board/enums/notification-templates.enum";

export interface ChatMessagePayload {
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
  pseudonym?: string;
  role?: string;
  photoUrl?: string;
  lastReadMessageId?: string
  lastMessageText?: string;
  lastMessageDate?: Date | string;
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
  isRead?: boolean;
  isDelivered?: boolean;
  isReadByOthers?: boolean;
}

export interface DirectCallMessageMeta {
  kind: 'direct-call-invite' | 'direct-call-answered' | 'direct-call-ended' | 'direct-call-missed' | 'direct-call-missed-email' | 'call-started';
  roomId: string;
  chatRoomId?: string;
  roomName?: string;
  callType: 'audio' | 'video';
  callerUserId: string;
  callerName?: string;
  callerEmail?: string;
  sentAt: number;
  actorUserId?: string;
  actorName?: string;
  answeredAt?: number;
  endedAt?: number;
}

export interface ChatMessageSendPayload extends ChatMessage {
  receiverId?: string;
  variables?: TemplateVariables | {};
  templateName: NotificationTemplate;
  selectedCommunicationMeans?: CommunicationMean[];
}

export interface TemplateVariables {
  positionName: string;
  positionId: string;
  companyName: string;
  companyId: string;
  timeSlot?: string;
  screeningLinkId?: string;
  assessmentType?: 'test' | 'interview' | 'live-coding';
  assessmentLinkId?: string;
  feedbackLinkId?: string;
  calendarLinkId?: string;
  joinInterviewLink?: string;
}