import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway, WebSocketServer
} from '@nestjs/websockets';
import { ObjectId } from 'bson';
import { Server, Socket } from 'socket.io';
import { CommunicationMean } from '../enums/communication-means.enum';
import { NotificationTemplate } from '../enums/notification-templates.enum';
import { MessageType } from '../models/chat-message';
import { ChatMessageService } from '../services/chat-message.service';
import { ChatRoomService } from '../services/chat-room.service';
import { NotificationTemplatesService } from '../services/notification-templates.service';
import { NotificationsService } from '../services/notifications.service';
import { VideoChatRoomParticipantService } from '../services/video-chat-room-participant.service';
import { VideoChatRoomService } from '../services/video-chat-room.service';
import { UsersService } from '../../users/services/user.service';

@WebSocketGateway({
  namespace: '/ws/textchat',
  cors: { origin: true, credentials: true }
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly directCallMissedEmailTimers = new Map<string, NodeJS.Timeout>();
  private readonly directCallMissedEmailDelayMs = Math.max(
    15000,
    Number(process.env.DIRECT_CALL_MISSED_EMAIL_DELAY_MS || 60000),
  );

  private readonly supportedDirectCallNotificationMeans = new Set<CommunicationMean>([
    CommunicationMean.sms,
    CommunicationMean.email,
    CommunicationMean.telegram,
    CommunicationMean.whatsapp,
  ]);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: ChatMessageService,
    private readonly chatRoomsService: ChatRoomService,
    private readonly videoChatRoomService: VideoChatRoomService,
    private readonly videoChatRoomParticipantService: VideoChatRoomParticipantService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationTemplatesService: NotificationTemplatesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  afterInit() {
    console.log('Chat gateway initialized');
  }

  private getUserRoom(userId: string): string {
    return `user:${String(userId || '').trim()}`;
  }

  private toObjectId(value: string): ObjectId | null {
    try {
      return new ObjectId(value);
    } catch {
      return null;
    }
  }

  private async resolveParticipantUserId(participant: { userId?: unknown; email?: unknown }): Promise<string> {
    const explicitUserId = String(participant?.userId || '').trim();
    if (explicitUserId) {
      return explicitUserId;
    }

    const email = String(participant?.email || '').trim().toLowerCase();
    if (!email) {
      return '';
    }

    try {
      const user = await this.usersService.findByEmail(email);
      return String(user?._id || '').trim();
    } catch (error) {
      console.error('Failed to resolve room participant by email', { email, error: error instanceof Error ? error.message : error });
      return '';
    }
  }

  private buildDirectCallTimerKey(roomId: string, chatRoomId: string, targetUserId: string): string {
    return [String(roomId || '').trim(), String(chatRoomId || '').trim(), String(targetUserId || '').trim()].join(':');
  }

  private clearDirectCallMissedEmailTimer(roomId: string, chatRoomId: string, targetUserId: string): void {
    const timerKey = this.buildDirectCallTimerKey(roomId, chatRoomId, targetUserId);
    const timer = this.directCallMissedEmailTimers.get(timerKey);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.directCallMissedEmailTimers.delete(timerKey);
  }

  private scheduleDirectCallMissedEmail(input: {
    roomId: string;
    chatRoomId: string;
    targetUserId: string;
    callerUserId: string;
    callerName: string;
    callType: 'audio' | 'video';
    roomName?: string;
    directCallLink: string;
    sentAt: number;
  }): void {
    const roomId = String(input.roomId || '').trim();
    const chatRoomId = String(input.chatRoomId || '').trim();
    const targetUserId = String(input.targetUserId || '').trim();
    if (!roomId || !chatRoomId || !targetUserId) {
      return;
    }

    this.clearDirectCallMissedEmailTimer(roomId, chatRoomId, targetUserId);

    const timerKey = this.buildDirectCallTimerKey(roomId, chatRoomId, targetUserId);
    const timer = setTimeout(() => {
      void (async () => {
        this.directCallMissedEmailTimers.delete(timerKey);

        try {
          const alreadyResolved = await this.messageService.hasDirectCallOutcomeSince(
            chatRoomId,
            roomId,
            input.sentAt,
            targetUserId,
          );

          if (alreadyResolved) {
            return;
          }

          const targetUser = await this.usersService.getByIdAsync(targetUserId);
          const targetEmail = String(targetUser?.email || '').trim();
          if (!targetEmail) {
            return;
          }

          const receiverName = String(targetUser?.firstname || targetEmail || 'there').trim() || 'there';
          const content = this.notificationTemplatesService.getMessageContent(
            receiverName,
            NotificationTemplate.DIRECT_CALL_MISSED,
            {
              callerName: input.callerName,
              callType: input.callType,
              roomName: input.roomName,
              directCallLink: input.directCallLink,
            },
          );

          await this.notificationsService.notifyUserAboutNewMessage({
            phoneNumber: String(targetUser?.phone || '').trim(),
            firstName: receiverName,
            email: targetEmail,
            telegramChatId: targetUser?.telegram?.chatId,
            preferences: {
              enabled: true,
              email: true,
              sms: false,
              telegram: false,
              whatsapp: false,
              viber: false,
            },
          }, content);

          const emailSentAt = Date.now();
          const followUpMessage = await this.messageService.createSystemMessage(
            new ObjectId(input.callerUserId),
            {
              roomId: chatRoomId,
              receiverId: targetUserId,
              content: `${input.callType === 'audio' ? 'Audio' : 'Video'} missed-call email sent to ${receiverName}`,
              meta: {
                kind: 'direct-call-missed-email',
                roomId,
                chatRoomId,
                roomName: input.roomName,
                callType: input.callType,
                callerUserId: input.callerUserId,
                callerName: input.callerName,
                sentAt: emailSentAt,
                actorUserId: input.callerUserId,
                actorName: input.callerName,
              },
            },
          );

          if (followUpMessage) {
            this.server.to(chatRoomId).emit('new-message', followUpMessage);
          }
        } catch (error) {
          console.error('Failed to send delayed missed-call email', {
            roomId,
            chatRoomId,
            targetUserId,
            error: error instanceof Error ? error.message : error,
          });
        }
      })();
    }, this.directCallMissedEmailDelayMs);

    this.directCallMissedEmailTimers.set(timerKey, timer);
  }

  handleConnection(client: Socket) {
    try {
      console.log('client.handshake', client.handshake);
      const token = client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      console.log('payload', payload);
      client.data.user = payload;

      const userId = payload.user._id;
      console.log('User id', userId);

      if (userId) {
        client.join(this.getUserRoom(userId));
      }

      // join all rooms of the user
      if (userId) {
        this.chatRoomsService.getByUserIdAsync(userId).then(rooms => {
          console.log('Rooms', rooms);
          rooms.forEach(room => {
            console.log('Join room', room._id);
            client.join(room._id.toString());
          });
        });
      }

    } catch (err) {
      console.error('WS auth failed', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected', client.id);
  }

  // JOIN ROOM

  @SubscribeMessage('join-room')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    client.join(data.roomId);
    console.log("@SubscribeMessage('join-room')", data.roomId);

    return {
      ok: true
    };
  }

  // SEND MESSAGE

  @SubscribeMessage('send-message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      roomId: string;
      content: string;
      receiverId: string,
      communicationMeans?: CommunicationMean[];
      templateName?: NotificationTemplate;
      msgId?: string;
    }
  ) {
    console.log("Chat Gateway @SubscribeMessage('send-message')", data, 'client.data.user', client.data.user.user._id);

    const userId = client.data.user?.user._id;

    if (!userId) {
      return { ok: false };
    }

    const result = await this.messageService.processIncomingMessage(new ObjectId(userId), data);
    console.log('Message', result);

    if (!result?.chatMessage) {
      return { ok: false };
    }

    this.server.to(data.roomId).emit("new-message", result.chatMessage);

    return { ok: true, msgId: data.msgId, message: result.chatMessage };
  }

  @SubscribeMessage('direct-call-invite')
  async directCallInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      roomId: string;
      chatRoomId?: string;
      targetUserId: string;
      roomName?: string;
      callType: 'audio' | 'video';
      selectedCommunicationMeans?: CommunicationMean[];
    }
  ) {
    const caller = client.data.user?.user;
    const callerUserId = String(caller?._id || '').trim();
    const targetUserId = String(data?.targetUserId || '').trim();
    const roomId = String(data?.roomId || '').trim();
    const chatRoomId = String(data?.chatRoomId || '').trim();
    const roomName = String(data?.roomName || '').trim();
    const callType = data?.callType === 'audio' ? 'audio' : 'video';
    const selectedCommunicationMeans = Array.isArray(data?.selectedCommunicationMeans)
      ? Array.from(new Set(data.selectedCommunicationMeans.filter((mean) => this.supportedDirectCallNotificationMeans.has(mean))))
      : [];

    if (!callerUserId || !targetUserId || !roomId || !chatRoomId) {
      return { ok: false };
    }

    const callerName = [caller?.firstname, caller?.lastname]
      .filter((part: string | undefined) => !!part)
      .join(' ')
      .trim() || String(caller?.email || 'Participant').trim();

    const targetRoom = this.getUserRoom(targetUserId);
    const targetSockets = this.server.sockets.adapter.rooms.get(targetRoom);
    const isTargetOnline = Boolean(targetSockets?.size);
    const effectiveCommunicationMeans = Array.from(new Set([
      ...selectedCommunicationMeans,
      ...(!isTargetOnline ? [CommunicationMean.email] : []),
    ]));

    this.server.to(targetRoom).emit('incoming-call', {
      roomId,
      chatRoomId,
      roomName: roomName || undefined,
      callType,
      callerUserId,
      callerName,
      callerEmail: String(caller?.email || '').trim() || undefined,
      sentAt: Date.now(),
    });

    const callLabel = callType === 'audio' ? 'Audio' : 'Video';
    const callLinkBase = String(process.env.WEBSITE_LINK || '').replace(/\/+$/, '');
    const directCallPath = `/recruitment/communication/room/${encodeURIComponent(roomId)}`;
    const directCallParams = new URLSearchParams({
      callType,
      chatRoomId,
      counterpartUserId: callerUserId,
      directCallRole: 'callee',
    });

    if (callerName) {
      directCallParams.set('counterpartName', callerName);
    }

    const directCallLink = callLinkBase
      ? `${callLinkBase}${directCallPath}?${directCallParams.toString()}`
      : `${directCallPath}?${directCallParams.toString()}`;
    const sentAt = Date.now();
    const result = await this.messageService.processIncomingMessage(new ObjectId(callerUserId), {
      roomId: chatRoomId,
      receiverId: targetUserId,
      content: `${callLabel} call invitation`,
      type: MessageType.SYSTEM,
      meta: {
        kind: 'direct-call-invite',
        roomId,
        chatRoomId,
        roomName: roomName || undefined,
        callType,
        callerUserId,
        callerName,
        callerEmail: String(caller?.email || '').trim() || undefined,
        sentAt,
      },
      templateName: effectiveCommunicationMeans.length ? NotificationTemplate.DIRECT_CALL_INVITE : undefined,
      communicationMeans: effectiveCommunicationMeans,
      skipExternalNotification: effectiveCommunicationMeans.length === 0,
    }, {
      callerName,
      callType,
      roomName: roomName || `${callLabel} call`,
      directCallLink,
    });

    const persistedMessage = result?.chatMessage;

    if (persistedMessage) {
      this.server.to(chatRoomId).emit('new-message', persistedMessage);
    }

    this.scheduleDirectCallMissedEmail({
      roomId,
      chatRoomId,
      targetUserId,
      callerUserId,
      callerName,
      callType,
      roomName: roomName || `${callLabel} call`,
      directCallLink,
      sentAt,
    });

    return {
      ok: true,
      delivered: isTargetOnline,
      messageId: persistedMessage?._id ? String(persistedMessage._id) : undefined,
      notificationResults: result?.notificationResults ?? [],
    };
  }

  @SubscribeMessage('room-call-invite')
  async roomCallInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      roomId: string;
      roomName?: string;
      callType: 'audio' | 'video';
    }
  ) {
    const caller = client.data.user?.user;
    const callerUserId = String(caller?._id || '').trim();
    const callerEmail = String(caller?.email || '').trim().toLowerCase();
    const roomId = String(data?.roomId || '').trim();
    const callType = data?.callType === 'audio' ? 'audio' : 'video';

    if (!callerUserId || !roomId) {
      return { ok: false };
    }

    const room = await this.videoChatRoomService.getByIdRawAsync(roomId);
    const roomObjectId = this.toObjectId(roomId);

    if (!room?._id || !roomObjectId) {
      return { ok: false };
    }

    const participants = await this.videoChatRoomParticipantService.findAsync({
      videoChatRoomId: roomObjectId,
    });

    const isCallerAllowed = participants.some((participant) => {
      const participantUserId = String(participant?.userId || '').trim();
      const participantEmail = String(participant?.email || '').trim().toLowerCase();

      return participantUserId === callerUserId || (!!callerEmail && participantEmail === callerEmail);
    }) || String(room.userId || '').trim() === callerUserId;

    if (!isCallerAllowed) {
      return { ok: false };
    }

    const callerName = [caller?.firstname, caller?.lastname]
      .filter((part: string | undefined) => !!part)
      .join(' ')
      .trim() || String(caller?.email || 'Participant').trim();
    const roomName = String(data?.roomName || room.name || '').trim() || undefined;

    const resolvedParticipantUserIds = await Promise.all(
      participants.map((participant) => this.resolveParticipantUserId(participant))
    );

    const targetUserIds = Array.from(new Set(
      resolvedParticipantUserIds
        .filter((participantUserId) => !!participantUserId && participantUserId !== callerUserId)
    ));

    let deliveredToOnlineCount = 0;
    for (const targetUserId of targetUserIds) {
      const targetRoom = this.getUserRoom(targetUserId);
      const targetSockets = this.server.sockets.adapter.rooms.get(targetRoom);
      if (targetSockets?.size) {
        deliveredToOnlineCount += 1;
      }

      this.server.to(targetRoom).emit('incoming-call', {
        roomId,
        roomName,
        callType,
        callerUserId,
        callerName,
        callerEmail: String(caller?.email || '').trim() || undefined,
        sentAt: Date.now(),
      });
    }

    const skippedParticipantCount = participants.filter((participant, index) => {
      const participantUserId = String(resolvedParticipantUserIds[index] || '').trim();
      const participantEmail = String(participant?.email || '').trim().toLowerCase();
      const isCaller = participantUserId === callerUserId || (!!callerEmail && participantEmail === callerEmail);
      return !isCaller && !participantUserId;
    }).length;

    const callLabel = callType === 'audio' ? 'Audio' : 'Video';
    const callStartedMessage = await this.messageService.createSystemMessage(
      new ObjectId(callerUserId),
      {
        roomId,
        receiverId: callerUserId,
        content: `${callerName} started a ${callLabel.toLowerCase()} call`,
        meta: {
          kind: 'call-started',
          roomId,
          roomName,
          callType,
          callerUserId,
          callerName,
          callerEmail: String(caller?.email || '').trim() || undefined,
          sentAt: Date.now(),
        },
      },
    );

    if (callStartedMessage) {
      this.server.to(roomId).emit('new-message', callStartedMessage);
    }

    return {
      ok: true,
      delivered: deliveredToOnlineCount > 0,
      notifiedParticipantCount: targetUserIds.length,
      deliveredToOnlineCount,
      skippedParticipantCount,
    };
  }

  // TYPING

  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean }
  ) {
    const userId = client.data.user?.user?._id;

    this.server.to(data.roomId).emit('typing', {
      userId,
      isTyping: data.isTyping
    });

  }

  // READ 

  @SubscribeMessage('read-messages')
  async readMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; messageIds: string[] }
  ) {
    const userId = client.data.user?.user._id;
    if (!userId || !data.messageIds?.length) {
      return { ok: false };
    }

    try {
      // update messages in DB
      await this.messageService.markAsReadManyAsync(data.messageIds, userId);
      await this.messageService.markAsDeliveredManyAsync(data.messageIds, userId);
      console.log('Messages Ids', data.messageIds);

      this.server.to(data.roomId).emit('messages-read', {
        userId,
        roomId: data.roomId,
        messageIds: data.messageIds
      });

      return { ok: true };
    } catch (err) {
      console.error('Failed to mark messages as read', err);
      return { ok: false, error: err.message };
    }
  }

}