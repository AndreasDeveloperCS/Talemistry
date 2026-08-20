import { Injectable } from '@nestjs/common';

@Injectable()
export class LiveCodingService {

  // roomId -> code
  private rooms = new Map<string, string>();

  getCode(roomId: string): string {
    return this.rooms.get(roomId) || '';
  }

  setCode(roomId: string, code: string): void {
    this.rooms.set(roomId, code);
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}