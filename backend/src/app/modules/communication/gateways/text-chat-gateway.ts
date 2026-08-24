import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';

import { Logger } from '@nestjs/common';
import { OnGatewayInit } from '@nestjs/websockets';
import { ChatMessage } from '../../chat/models/chat-message';
import { UsersService } from '../../users/services/user.service';
import { WsRegistry } from '../services/ws-registry.service';
const fs = require('fs');
const path = require('path');

// const options = {
//   key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
//   cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem')),
// };

@WebSocketGateway({
  namespace: '/ws/chat',
  transports: ['websocket', 'polling']
  //path: '/sockets/textchat',
  // key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
  // cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem')),
  // options: options,
  // serveClient: true,
  // cors: { origin: '*' },
})
export class TextChatGateway implements OnGatewayInit {
  collectionName = 'interviewChat';
  @WebSocketServer() server: Server;

  private logger = new Logger('AppGateway');

  constructor(private readonly registry: WsRegistry,
    private userService: UsersService,) {
    // console.log('AppGateway');
    //console.log(this.server);
  }

  afterInit(nsp: Namespace) {
    this.logger.log('Client afterInit 52');

    this.server.emit('message', 'Welcome to the server!');
    this.registry.register('notify', nsp);

    console.log('RTCGateway OnGatewayInit', nsp.sockets);
  }

  handleConnection(client) {
    // console.log('AppGateway handleConnection', 'client');
    client.emit('message', 'Welcome to the server!');
  }

  handleMessage(client, message) {
    // console.log('handleMessage', message);
    this.server.emit('message', message);
  }

  @SubscribeMessage('message')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(data, client);

    return data;
  }

  @SubscribeMessage('message')
  message(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    message: any) {
    console.log('SubscribeMessage(message)', message, client);
    // console.log('AppGateway handleConnection', 'chatMessage', message);
    return {
      event: 'message',
      message,
    };
  }

  @SubscribeMessage('message')
  async handleMessage1(
    @ConnectedSocket()
    client: Socket,
    //sender: string, room: string, message: ChatMessage 
    @MessageBody()
    message: { sender: string, room: string, message: ChatMessage }
  ) {
    console.log('AppGateway handleMessage1', message,
      message?.sender,
      message?.room,
      message?.message
    );

    if (!message || !message.room || !message.message.userId) {
      return;
    }

    const user = await this.userService.findById(message.message.userId);


    message.message.firstname = user.firstname;
    message.message.lastname = user.lastname;

    this.server.emit(`message-${message.room}`, message);

    //client.emit(`message-${message.room}`, message);

    return '';
  }

  @SubscribeMessage('joinRoom')
  async handleRoomJoin(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    message: { semder: string, room: string }) {

    // console.log('TextChatGateway joinRoom', 'handleRoomJoin', message.room);

    try {
      const user = await this.userService.findById(message?.semder);
      client.join(message.room);
      client.emit('joinedRoom', `${user.firstname} ${user.lastname} has joined`);
      this.server.emit('joinedRoom', `${user.firstname} ${user.lastname} has joined`);
    } catch (ex) {

    }

  }

  @SubscribeMessage('leaveRoom')
  async handleRoomLeave(client: Socket, @MessageBody()
  message: { semder: string, room: string }) {
    // console.log('AppGateway handleRoomLeave leaveRoom', message.room);
    try {
      const user = await this.userService.findById(message?.semder);
      client.leave(message.room);
      client.emit('leftRoom', `${user.firstname} ${user.lastname} has left`);
      this.server.emit('leftRoom', `${user.firstname} ${user.lastname} has left`);
    } catch (ex) {

    }

  }
}
