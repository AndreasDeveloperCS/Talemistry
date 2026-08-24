import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

interface ChatMessage {
  room: string
  author: string
  body: string
  at?: string
}

/**
 * Recruiter collaboration: presence, typing indicators, and threaded chat on a
 * candidate or interview. Used by both the Next.js and Angular front-ends.
 */
@WebSocketGateway({ namespace: '/collab', cors: { origin: true, credentials: true } })
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(CollaborationGateway.name)
  private readonly presence = new Map<string, Set<string>>()

  handleConnection(client: Socket) {
    this.logger.debug(`collab connect ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    for (const [room, members] of this.presence) {
      if (members.delete(client.id)) {
        this.server.to(room).emit('presence', { room, count: members.size })
      }
    }
  }

  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    void client.join(room)
    const members = this.presence.get(room) ?? new Set<string>()
    members.add(client.id)
    this.presence.set(room, members)
    this.server.to(room).emit('presence', { room, count: members.size })
    return { room, count: members.size }
  }

  @SubscribeMessage('typing')
  onTyping(@MessageBody() payload: { room: string; author: string }) {
    this.server.to(payload.room).emit('typing', payload)
  }

  @SubscribeMessage('message')
  onMessage(@MessageBody() msg: ChatMessage) {
    const enriched = { ...msg, at: new Date().toISOString() }
    this.server.to(msg.room).emit('message', enriched)
    return enriched
  }
}
