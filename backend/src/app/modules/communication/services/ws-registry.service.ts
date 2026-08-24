import { Injectable } from '@nestjs/common';
import { Namespace } from 'socket.io';

@Injectable()
export class WsRegistry {
    private readonly map = new Map<string, Namespace>();

    register(key: 'chat' | 'notify' | string, nsp: Namespace) {
        this.map.set(key, nsp);
    }

    get(key: string): Namespace | undefined {
        return this.map.get(key);
    }
}