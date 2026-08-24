import { Injectable } from '@nestjs/common';
import { WsRegistry } from './ws-registry.service';

@Injectable()
export class WsEmitter {
    constructor(private readonly registry: WsRegistry) { }

    // Emit to everyone in /ws/chat
    toChat(event: string, payload: any) {
        this.registry.get('chat')?.emit(event, payload);
    }

    // Emit to a room in /ws/chat
    toChatRoom(roomId: string, event: string, payload: any) {
        this.registry.get('chat')?.to(roomId).emit(event, payload);
    }

    // Emit to a user room (e.g., userId) in /ws/notify
    toUserNotify(userId: string, event: string, payload: any) {
        this.registry.get('notify')?.to(userId).emit(event, payload);
    }
}