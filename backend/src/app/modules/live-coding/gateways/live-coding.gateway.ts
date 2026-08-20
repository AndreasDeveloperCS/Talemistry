import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveCodingService } from '../services/live-coding.service';
import { JoinRoomPayload, CodeChangePayload, FocusEventType, ClipboardEventType } from '../models/live-coding.types';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { CodeExecutionService } from '../services/code-execution.service';
import { timeStamp } from 'node:console';
import { SqlExecutionContext } from '../models/sql-execution-context';
import { SqlExecutionService } from '../services/sql-execution-service.service';

@WebSocketGateway({
  namespace: '/ws/livecoding',
  cors: { origin: true, credentials: true }
})
export class LiveCodingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly liveCodingService: LiveCodingService,
    private readonly jwtService: JwtService,
    private execService: CodeExecutionService,
    private sqlExecutionService: SqlExecutionService
  ) {}

  afterInit() {
    console.log('Live coding gateway initialized');
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

    } catch (err) {
      console.error('WS auth failed', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected', client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: JoinRoomPayload) {
    const user = client.data.user;
    const userId = user?.user?._id;

    if (!payload.roomId) {
      client.emit('error', 'Missing roomId');
      return;
    }

    if (payload.roomId.startsWith('user-')) {
      const roomUserId = payload.roomId.replace('user-', '');

      if (roomUserId !== userId) {
        client.emit('error', 'Unauthorized room access');
        client.disconnect();
        return;
      }
    }

    console.log('User joining room', payload.roomId, 'User ID:', userId);
    client.join(payload.roomId);

    const code = this.liveCodingService.getCode(payload.roomId);
    client.emit('codeUpdate', code);
  }

  @SubscribeMessage('codeChange')
  handleCodeChange(client: Socket, payload: CodeChangePayload) {
      if (!this.validateRoomAccess(client, payload.roomId)){
        return;
      }
      this.liveCodingService.setCode(payload.roomId, payload.code);
      client.to(payload.roomId).emit('codeUpdate', payload.code);
  }

  @SubscribeMessage('runCode')
  async handleRunCode(
    @MessageBody() data: { code: string; language: string; roomId: string, sqlContext?: SqlExecutionContext },
    @ConnectedSocket() client: Socket
  ) {
    if (!this.validateRoomAccess(client, data.roomId)) {
      return;
    }
    if (data.language === 'sql' && !data.sqlContext) {
      this.server.to(data.roomId).emit(
        'codeOutput',
        'Missing SQL context for execution'
      );
      return;
    }
    try {
      if (data.language === 'sql') {
        this.sqlExecutionService.executeSql(
          data.code,
          data.sqlContext,
          (output) => {
            this.server.to(data.roomId).emit('codeOutput', output);
          }
        );
        return;
      }

      await this.execService.executeViaDocker(
        data.roomId,
        data.code,
        data.language,
        (output) => {
          this.server.to(data.roomId).emit('codeOutput', output);
        },
        data.sqlContext
      );
    } catch (err: any) {
      this.server.to(data.roomId).emit(
        'codeOutput',
        `Execution error: ${err.message}`
      );
    }
  }

  @SubscribeMessage('cursorMove')
  handleCursorMove(
    @MessageBody() data: {
      roomId: string;
      position: { lineNumber: number; column: number };
      userName: string;
      color: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!this.validateRoomAccess(client, data.roomId)) {
      return;
    }
    client.to(data.roomId).emit('remoteCursorMove', {
      userName: data.userName,
      color: data.color,
      position: data.position,
    });
  }

  @SubscribeMessage('languageChange')
  handleLanguageChange(
    @MessageBody() data: {
      roomId: string;
      language: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!this.validateRoomAccess(client, data.roomId)) {
      return;
    }
    client.to(data.roomId).emit('remoteLanguageChange', {
      language: data.language,
    });
  }

  @SubscribeMessage('interview:clipboard')
  handleClipboardUsage(
    @MessageBody() data: {
      type: ClipboardEventType, 
      length?: number,
      timestamp: Date,
      userId: string,
      roomId: string
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!this.validateRoomAccess(client, data.roomId)) {
      return;
    }
    client.to(data.roomId).emit('interview:clipboard', {
      type: data.type,
      length: data.length,
      timeStamp: data.timestamp,
      userId: data.userId
    });
  }

  @SubscribeMessage('interview:focus')
  handleFocusChange(
    @MessageBody() data: {
      type: FocusEventType,
      timestamp: Date,
      userId: string,
      roomId: string
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!this.validateRoomAccess(client, data.roomId)) {
      return;
    }
    client.to(data.roomId).emit('interview:focus', {
      type: data.type,
      timeStamp: data.timestamp,
      userId: data.userId
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, payload: { roomId: string }) {
      client.leave(payload.roomId);
  }

  private validateRoomAccess(client: Socket, roomId: string): boolean {
    const user = client.data.user;
    const userId = user?.user?._id;

    if (!roomId) {
      return false;
    }

    if (roomId.startsWith('user-')) {
      const roomUserId = roomId.replace('user-', '');
      return roomUserId === userId;
    }

    return true;
  }
}