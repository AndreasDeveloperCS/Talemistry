import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { JourneyStage } from '../common/journey'

export interface PipelineMoveEvent {
  candidateId: string
  stage: JourneyStage
  actor?: string
}

/**
 * Broadcasts live pipeline changes so every recruiter's Kanban board stays in
 * sync without polling. Rooms are scoped per job so boards only receive
 * relevant traffic.
 */
@WebSocketGateway({ namespace: '/pipeline', cors: { origin: true, credentials: true } })
export class PipelineGateway {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(PipelineGateway.name)

  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() client: Socket, @MessageBody() jobId: string) {
    const room = jobId ? `job:${jobId}` : 'board:all'
    void client.join(room)
    this.logger.debug(`${client.id} joined ${room}`)
    return { joined: room }
  }

  /** Optimistic drag from one client, rebroadcast to the room. */
  @SubscribeMessage('move')
  onMove(@MessageBody() event: PipelineMoveEvent) {
    this.broadcastMove(event)
    return { ok: true }
  }

  broadcastMove(event: PipelineMoveEvent) {
    this.server.emit('candidate:moved', event)
  }
}
