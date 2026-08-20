import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class VideoInterviewService {
    private readonly logger = new Logger(VideoInterviewService.name);
    private server: Server | null = null;

    setServer(server: Server) {
        this.server = server;
    }

    leaveAll(client: Socket) {
        try {
            const rooms = Array.from(client.rooms || []);
            rooms.forEach((r) => {
                if (r !== client.id) {
                    client.leave(r);
                    this.server?.to(r).emit('participant-left', { clientId: client.id });
                }
            });
        } catch (err) {
            this.logger.error('Error leaving rooms', err as any);
        }
    }

    broadcastToRoom(room: string, event: string, payload: any) {
        this.server?.to(room).emit(event, payload);
    }
}
