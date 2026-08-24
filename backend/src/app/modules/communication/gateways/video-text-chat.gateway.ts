import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway, WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VideoChatRoomService } from '../services/video-chat-room.service';

@WebSocketGateway({
  namespace: '/ws/videotextchat',
  cors: { origin: true, credentials: true }
})
export class VideoTextChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly socketUsers = new Map<string, { userId?: string; email?: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly videoChatRoomService: VideoChatRoomService,
  ) { }

  afterInit() {
    console.log('Video text chat gateway initialized');
  }

  handleConnection(client: Socket) {
    try {
      console.log('videotextchat client.handshake', client.handshake);

      const token = client.handshake.auth?.token;

      if (token && /^[-A-Za-z0-9_=]+\.[-A-Za-z0-9_=]+(?:\.[-A-Za-z0-9_+=/]*)?$/.test(String(token).trim())) {
        const payload = this.jwtService.verify(token);
        client.data.user = payload;
        this.socketUsers.set(client.id, {
          userId: String(payload?.user?._id ?? '').trim() || undefined,
          email: String(payload?.user?.email ?? '').trim().toLowerCase() || undefined,
        });
        console.log('client.data.user', client.data.user, client.data.user.user._id);
      }

    } catch (err) {
      console.error('WS auth failed for video text chat, continuing as guest', err);
    }
  }

  handleDisconnect(client: Socket) {
    this.socketUsers.delete(client.id);
    console.log('client disconnected', client.id);
  }

  // JOIN ROOM

  @SubscribeMessage('join-room')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; displayName?: string; userEmail?: string; joinToken?: string }
  ) {
    const roomId = String(data?.roomId ?? '').trim();
    if (!roomId) {
      return { ok: false, error: 'roomId is required' };
    }

    const authEmail = this.socketUsers.get(client.id)?.email;
    const userEmail = String(data?.userEmail ?? authEmail ?? '').trim().toLowerCase() || undefined;
    const joinToken = String(data?.joinToken ?? '').trim() || undefined;

    try {
      await this.videoChatRoomService.joinRoomByTokenAsync(roomId, userEmail, joinToken);
      client.join(roomId);
      console.log("@SubscribeMessage('join-room')", roomId, { userEmail, hasJoinToken: !!joinToken });
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'forbidden' };
    }

    return {
      ok: true
    };
  }

  // SEND MESSAGE

  @SubscribeMessage('chat-message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {
    const roomId = String(data?.roomId ?? '').trim();
    if (!roomId || !client.rooms.has(roomId)) {
      return { ok: false };
    }

    const userId = this.socketUsers.get(client.id)?.userId;

    const message = {
      roomId,
      text: data.text,
      msgId: data.msgId,
      meta: data.meta,
      from: userId || client.id,
      sentAt: Date.now(),
    };

    const sockets = await this.server.in(roomId).fetchSockets();
    console.log('ROOM MEMBERS:', sockets.map(s => s.id));

    console.log('Message', message);

    this.server.to(roomId).emit("new-message", message);

    return { ok: true, msgId: data.msgId, echo: message };
  }

  // TYPING

  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean }
  ) {
    const roomId = String(data?.roomId ?? '').trim();
    if (!roomId || !client.rooms.has(roomId)) {
      return;
    }

    const userId = this.socketUsers.get(client.id)?.userId;

    this.server.to(roomId).emit('typing', {
      userId,
      isTyping: data.isTyping
    });

  }
}