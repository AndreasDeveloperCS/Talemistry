import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface SignalPayload {
    room: string;
    from: string;
    to?: string;
    data: unknown;
}
export declare class SignalingGateway implements OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private readonly rooms;
    onJoin(client: Socket, payload: {
        room: string;
        peerId: string;
    }): {
        room: string;
        peers: string[];
    };
    onOffer(payload: SignalPayload): void;
    onAnswer(payload: SignalPayload): void;
    onIce(payload: SignalPayload): void;
    handleDisconnect(client: Socket): void;
}
export {};
