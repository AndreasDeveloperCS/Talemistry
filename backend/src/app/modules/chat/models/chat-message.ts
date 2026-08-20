export interface ChatMessage {

  parrentId?: string;

  participantId?: string | undefined;

  messageText?: string;

  isDelivered?: boolean;
  isRead?: boolean;

  interviewId?: string;
  userId?: string;

  firstname?: string;
  lastname?: string;

  messageCreated?: Date;
}
