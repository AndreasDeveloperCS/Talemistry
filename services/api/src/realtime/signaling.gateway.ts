import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

/**
 * WebRTC signaling for live video interviews and live-coding rooms.
 * This exchanges SDP offers/answers and ICE candidates only — media flows
 * peer-to-peer (or via a TURN relay configured on the client). Mesh topology
 * suits small interview panels; swap to an SFU for larger rooms.
 */
interface SignalPayload {
  room: string
  from: string
  to?: string
  data: unknown
}

@WebSocketGateway({ namespace: '/rtc', cors: { origin: true, credentials: true } })
export class SignalingGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(SignalingGateway.name)
  private readonly rooms = new Map<string, Set<string>>()

  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { room: string; peerId: string }) {
    const { room, peerId } = payload
    void client.join(room)
    const peers = this.rooms.get(room) ?? new Set<string>()
    // Tell the newcomer who is already here so it can create offers.
    const existing = [...peers]
    peers.add(peerId)
    this.rooms.set(room, peers)
    client.data.peerId = peerId
    client.data.room = room
    client.to(room).emit('peer:joined', { peerId })
    this.logger.debug(`peer ${peerId} joined rtc room ${room}`)
    return { room, peers: existing }
  }

  @SubscribeMessage('offer')
  onOffer(@MessageBody() payload: SignalPayload) {
    this.server.to(payload.room).emit('offer', payload)
  }

  @SubscribeMessage('answer')
  onAnswer(@MessageBody() payload: SignalPayload) {
    this.server.to(payload.room).emit('answer', payload)
  }

  @SubscribeMessage('ice-candidate')
  onIce(@MessageBody() payload: SignalPayload) {
    this.server.to(payload.room).emit('ice-candidate', payload)
  }

  handleDisconnect(client: Socket) {
    const room = client.data?.room as string | undefined
    const peerId = client.data?.peerId as string | undefined
    if (room && peerId) {
      this.rooms.get(room)?.delete(peerId)
      client.to(room).emit('peer:left', { peerId })
    }
  }
}
