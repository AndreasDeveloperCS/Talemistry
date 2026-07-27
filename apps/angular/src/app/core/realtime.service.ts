import { Injectable, NgZone, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { io, Socket } from 'socket.io-client'
import { environment } from './environment'

/**
 * Thin wrapper around Socket.IO namespaces that mirror the NestJS gateways:
 *  - /pipeline     live Kanban stage moves
 *  - /collab       presence + comment threads
 *  - /signaling    WebRTC offer/answer/ICE relay for interview rooms
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private zone = inject(NgZone)
  private sockets = new Map<string, Socket>()

  private connect(namespace: string): Socket {
    let socket = this.sockets.get(namespace)
    if (!socket) {
      socket = io(`${environment.wsUrl}${namespace}`, {
        transports: ['websocket'],
        autoConnect: true,
      })
      this.sockets.set(namespace, socket)
    }
    return socket
  }

  on<T>(namespace: string, event: string): Observable<T> {
    const socket = this.connect(namespace)
    return new Observable<T>((subscriber) => {
      const handler = (payload: T) => this.zone.run(() => subscriber.next(payload))
      socket.on(event, handler)
      return () => socket.off(event, handler)
    })
  }

  emit(namespace: string, event: string, payload: unknown): void {
    this.connect(namespace).emit(event, payload)
  }

  disconnectAll(): void {
    this.sockets.forEach((s) => s.disconnect())
    this.sockets.clear()
  }
}
