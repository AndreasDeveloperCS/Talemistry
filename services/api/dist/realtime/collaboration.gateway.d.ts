import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface ChatMessage {
    room: string;
    author: string;
    body: string;
    at?: string;
}
export declare class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly presence;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    onJoin(client: Socket, room: string): {
        room: string;
        count: number;
    };
    onTyping(payload: {
        room: string;
        author: string;
    }): void;
    onMessage(msg: ChatMessage): {
        at: string;
        room: string;
        author: string;
        body: string;
    };
}
export {};
