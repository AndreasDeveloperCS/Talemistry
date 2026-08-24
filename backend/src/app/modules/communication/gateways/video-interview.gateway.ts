import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VideoInterviewService } from '../services/video-interview.service';

@WebSocketGateway({ namespace: '/video-interview', cors: true })
export class VideoInterviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(VideoInterviewGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(private readonly videoInterviewService: VideoInterviewService) { }

    afterInit(server: Server) {
        this.logger.log('VideoInterviewGateway initialized');
        this.videoInterviewService.setServer(server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id} -> ${client.handshake.address}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.videoInterviewService.leaveAll(client);
    }

    @SubscribeMessage('join')
    async handleJoin(@MessageBody() payload: { room: string; userId?: string }, @ConnectedSocket() client: Socket) {
        const { room } = payload;
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        this.server.to(room).emit('participant-joined', { clientId: client.id, userId: payload.userId });
    }

    @SubscribeMessage('leave')
    async handleLeave(@MessageBody() payload: { room: string }, @ConnectedSocket() client: Socket) {
        const { room } = payload;
        client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        this.server.to(room).emit('participant-left', { clientId: client.id });
    }

    @SubscribeMessage('signal')
    async handleSignal(@MessageBody() payload: { room: string; data: any }, @ConnectedSocket() client: Socket) {
        const { room, data } = payload;
        // forward to other participants in room
        client.to(room).emit('signal', { from: client.id, data });
    }
}
