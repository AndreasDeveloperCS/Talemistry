import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {
    private rooms = new Map<string, Set<string>>(); // roomId -> set of socketIds
    private socketRooms = new Map<string, Set<string>>(); // socketId -> set of roomIds

    join(roomId: string, socketId: string) {
        if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
        this.rooms.get(roomId)!.add(socketId);

        if (!this.socketRooms.has(socketId)) this.socketRooms.set(socketId, new Set());
        this.socketRooms.get(socketId)!.add(roomId);
    }

    leave(roomId: string, socketId: string) {
        this.rooms.get(roomId)?.delete(socketId);
        if (this.rooms.get(roomId)?.size === 0) this.rooms.delete(roomId);

        this.socketRooms.get(socketId)?.delete(roomId);
        if (this.socketRooms.get(socketId)?.size === 0) this.socketRooms.delete(socketId);
    }

    leaveAll(socketId: string): string[] {
        const roomIds = [...(this.socketRooms.get(socketId) ?? new Set())];
        for (const roomId of roomIds) {
            this.leave(roomId, socketId);
        }
        return roomIds;
    }

    has(roomId: string, socketId: string): boolean {
        return this.rooms.get(roomId)?.has(socketId) ?? false;
    }

    peers(roomId: string, except?: string): string[] {
        const s = this.rooms.get(roomId);
        if (!s) return [];
        return [...s].filter(id => id !== except);
    }
}
