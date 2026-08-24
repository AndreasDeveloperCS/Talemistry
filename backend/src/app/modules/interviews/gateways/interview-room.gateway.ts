import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { exposedHeaders, headers, methods, whiteList } from '../../../config';

interface InterviewRoom {
  roomId: string;
  hostId: string;
  hostSocketId: string;
  hostName: string;
  candidateId?: string;
  candidateSocketId?: string;
  candidateName?: string;
  createdAt: Date;
  isRecording: boolean;
  lastActivity: Date;
  interviewType: 'interview';
  maxParticipants: 2;
}

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  role: 'host' | 'candidate';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

@WebSocketGateway({
  namespace: '/ws/interview',
  maxHttpBufferSize: 1e7,
  cors: {
    credentials: true,
    allowedHeaders: headers,
    origin: whiteList,
    exposedHeaders: exposedHeaders,
    methods: methods,
  }
})
export class InterviewRoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private rooms: Map<string, InterviewRoom> = new Map();
  private participants: Map<string, Participant> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private logger = new Logger('InterviewRoomGateway');

  // Cleanup interval for inactive rooms (15 minutes)
  private readonly ROOM_TIMEOUT = 15 * 60 * 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 60000); // Check every minute
  }

  afterInit(server: Server) {
    this.logger.log('Interview Room Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const roomId = this.socketToRoom.get(client.id);

    if (roomId) {
      this.handleUserLeave(client, roomId);
    }
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; userName: string }
  ) {
    const { roomId, userId, userName } = data;

    // Check if room already exists
    if (this.rooms.has(roomId)) {
      throw new WsException('Room already exists');
    }

    // Create new interview room
    const room: InterviewRoom = {
      roomId,
      hostId: userId,
      hostSocketId: client.id,
      hostName: userName,
      createdAt: new Date(),
      isRecording: false,
      lastActivity: new Date(),
      interviewType: 'interview',
      maxParticipants: 2
    };

    this.rooms.set(roomId, room);

    // Create host participant
    const hostParticipant: Participant = {
      socketId: client.id,
      userId,
      userName,
      role: 'host',
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false
    };

    this.participants.set(client.id, hostParticipant);
    this.socketToRoom.set(client.id, roomId);

    // Join socket.io room
    client.join(roomId);

    this.logger.log(`Room created: ${roomId} by ${userName}`);

    client.emit('roomCreated', {
      roomId,
      role: 'host',
      participants: [hostParticipant]
    });

    return { success: true, roomId, role: 'host' };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; userName: string }
  ) {
    const { roomId, userId, userName } = data;

    // Check if room exists
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new WsException('Room not found');
    }

    // Check if user is the host
    if (room.hostId === userId) {
      // Rejoin as host
      const hostParticipant: Participant = {
        socketId: client.id,
        userId,
        userName,
        role: 'host',
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false
      };

      this.participants.set(client.id, hostParticipant);
      this.socketToRoom.set(client.id, roomId);
      client.join(roomId);

      room.hostSocketId = client.id;
      room.lastActivity = new Date();

      const allParticipants = this.getRoomParticipants(roomId);

      client.emit('roomJoined', {
        roomId,
        role: 'host',
        participants: allParticipants
      });

      // Notify other participants
      client.to(roomId).emit('userJoined', {
        participant: hostParticipant,
        participants: allParticipants
      });

      return { success: true, roomId, role: 'host' };
    }

    // Check if room is full (max 2 participants)
    const currentParticipants = this.getRoomParticipants(roomId);
    if (currentParticipants.length >= room.maxParticipants) {
      throw new WsException('Room is full. Maximum 2 participants allowed for interviews.');
    }

    // Check if candidate already joined
    if (room.candidateId && room.candidateId !== userId) {
      throw new WsException('Another candidate has already joined this interview');
    }

    // Join as candidate
    const candidateParticipant: Participant = {
      socketId: client.id,
      userId,
      userName,
      role: 'candidate',
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false
    };

    room.candidateId = userId;
    room.candidateSocketId = client.id;
    room.candidateName = userName;
    room.lastActivity = new Date();

    this.participants.set(client.id, candidateParticipant);
    this.socketToRoom.set(client.id, roomId);
    client.join(roomId);

    const allParticipants = this.getRoomParticipants(roomId);

    this.logger.log(`User joined room: ${userName} -> ${roomId}`);

    client.emit('roomJoined', {
      roomId,
      role: 'candidate',
      participants: allParticipants
    });

    // Notify other participants
    client.to(roomId).emit('userJoined', {
      participant: candidateParticipant,
      participants: allParticipants
    });

    return { success: true, roomId, role: 'candidate' };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    this.handleUserLeave(client, data.roomId);
    return { success: true };
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetSocketId: string; offer: RTCSessionDescriptionInit }
  ) {
    const { roomId, targetSocketId, offer } = data;

    this.logger.log(`Offer sent in room ${roomId}`);

    // Send offer to target peer
    this.server.to(targetSocketId).emit('offer', {
      offer,
      senderSocketId: client.id
    });

    this.updateRoomActivity(roomId);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetSocketId: string; answer: RTCSessionDescriptionInit }
  ) {
    const { roomId, targetSocketId, answer } = data;

    this.logger.log(`Answer sent in room ${roomId}`);

    // Send answer to target peer
    this.server.to(targetSocketId).emit('answer', {
      answer,
      senderSocketId: client.id
    });

    this.updateRoomActivity(roomId);
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetSocketId: string; candidate: RTCIceCandidateInit }
  ) {
    const { roomId, targetSocketId, candidate } = data;

    // Send ICE candidate to target peer
    this.server.to(targetSocketId).emit('iceCandidate', {
      candidate,
      senderSocketId: client.id
    });

    this.updateRoomActivity(roomId);
  }

  @SubscribeMessage('toggleAudio')
  handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; enabled: boolean }
  ) {
    const participant = this.participants.get(client.id);
    if (participant) {
      participant.audioEnabled = data.enabled;

      // Notify other participants
      client.to(data.roomId).emit('participantAudioToggled', {
        socketId: client.id,
        enabled: data.enabled
      });

      this.updateRoomActivity(data.roomId);
    }
  }

  @SubscribeMessage('toggleVideo')
  handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; enabled: boolean }
  ) {
    const participant = this.participants.get(client.id);
    if (participant) {
      participant.videoEnabled = data.enabled;

      // Notify other participants
      client.to(data.roomId).emit('participantVideoToggled', {
        socketId: client.id,
        enabled: data.enabled
      });

      this.updateRoomActivity(data.roomId);
    }
  }

  @SubscribeMessage('startScreenShare')
  handleStartScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const participant = this.participants.get(client.id);
    if (participant) {
      participant.screenSharing = true;

      // Notify other participants
      client.to(data.roomId).emit('participantStartedScreenShare', {
        socketId: client.id,
        userName: participant.userName
      });

      this.updateRoomActivity(data.roomId);
    }
  }

  @SubscribeMessage('stopScreenShare')
  handleStopScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const participant = this.participants.get(client.id);
    if (participant) {
      participant.screenSharing = false;

      // Notify other participants
      client.to(data.roomId).emit('participantStoppedScreenShare', {
        socketId: client.id
      });

      this.updateRoomActivity(data.roomId);
    }
  }

  @SubscribeMessage('chatMessage')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string }
  ) {
    const participant = this.participants.get(client.id);
    if (participant) {
      const chatMessage = {
        socketId: client.id,
        userId: participant.userId,
        userName: participant.userName,
        message: data.message,
        timestamp: new Date()
      };

      // Broadcast to all participants in the room
      this.server.to(data.roomId).emit('chatMessage', chatMessage);

      this.updateRoomActivity(data.roomId);
    }
  }

  @SubscribeMessage('startRecording')
  handleStartRecording(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const room = this.rooms.get(data.roomId);
    const participant = this.participants.get(client.id);

    // Only host can start recording
    if (room && participant && participant.role === 'host') {
      room.isRecording = true;

      // Notify all participants
      this.server.to(data.roomId).emit('recordingStarted', {
        timestamp: new Date()
      });

      this.logger.log(`Recording started in room ${data.roomId}`);

      return { success: true };
    }

    throw new WsException('Only host can start recording');
  }

  @SubscribeMessage('stopRecording')
  handleStopRecording(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const room = this.rooms.get(data.roomId);
    const participant = this.participants.get(client.id);

    // Only host can stop recording
    if (room && participant && participant.role === 'host') {
      room.isRecording = false;

      // Notify all participants
      this.server.to(data.roomId).emit('recordingStopped', {
        timestamp: new Date()
      });

      this.logger.log(`Recording stopped in room ${data.roomId}`);

      return { success: true };
    }

    throw new WsException('Only host can stop recording');
  }

  @SubscribeMessage('getRoomInfo')
  handleGetRoomInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const room = this.rooms.get(data.roomId);

    if (!room) {
      throw new WsException('Room not found');
    }

    const participants = this.getRoomParticipants(data.roomId);

    return {
      room: {
        roomId: room.roomId,
        isRecording: room.isRecording,
        createdAt: room.createdAt
      },
      participants
    };
  }

  // Helper methods
  private handleUserLeave(client: Socket, roomId: string) {
    const participant = this.participants.get(client.id);

    if (!participant) {
      return;
    }

    this.logger.log(`User left room: ${participant.userName} from ${roomId}`);

    // Remove participant
    this.participants.delete(client.id);
    this.socketToRoom.delete(client.id);
    client.leave(roomId);

    // Get remaining participants
    const remainingParticipants = this.getRoomParticipants(roomId);

    // Notify other participants
    client.to(roomId).emit('userLeft', {
      socketId: client.id,
      userName: participant.userName,
      participants: remainingParticipants
    });

    // If no participants left or only one remains, destroy the room
    if (remainingParticipants.length === 0) {
      this.destroyRoom(roomId);
    } else {
      this.updateRoomActivity(roomId);
    }
  }

  private getRoomParticipants(roomId: string): Participant[] {
    const participants: Participant[] = [];

    for (const [socketId, participant] of this.participants.entries()) {
      if (this.socketToRoom.get(socketId) === roomId) {
        participants.push(participant);
      }
    }

    return participants;
  }

  private updateRoomActivity(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = new Date();
    }
  }

  private destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);

    if (room) {
      this.logger.log(`Destroying room: ${roomId}`);

      // Remove all participants from this room
      for (const [socketId, participant] of this.participants.entries()) {
        if (this.socketToRoom.get(socketId) === roomId) {
          this.participants.delete(socketId);
          this.socketToRoom.delete(socketId);
        }
      }

      // Remove room
      this.rooms.delete(roomId);
    }
  }

  private cleanupInactiveRooms() {
    const now = new Date().getTime();

    for (const [roomId, room] of this.rooms.entries()) {
      const inactiveTime = now - room.lastActivity.getTime();

      if (inactiveTime > this.ROOM_TIMEOUT) {
        this.logger.log(`Cleaning up inactive room: ${roomId}`);

        // Notify participants before destroying
        this.server.to(roomId).emit('roomTimeout', {
          message: 'Room closed due to inactivity'
        });

        this.destroyRoom(roomId);
      }
    }
  }

  ngOnDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

