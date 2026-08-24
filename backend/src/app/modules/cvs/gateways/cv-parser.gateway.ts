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

@WebSocketGateway({
  namespace: '/ws/cvparser',
  cors: { origin: true, credentials: true }
})
export class CVParserGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
  ) { }

  afterInit() {
    console.log('Chat gateway initialized');
  }

  private getUserRoom(userId: string): string {
    return `user:${String(userId || '').trim()}`;
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

    } catch (err) {
      console.error('WS auth failed', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected', client.id);
  }

  @SubscribeMessage('join-room')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    client.join(data.roomId);
    console.log("@SubscribeMessage('join-room')", data.roomId);

    return { ok: true };
  }
}