import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { exposedHeaders, headers, whiteList, methods } from '../../../config';
import { Server, Socket } from 'socket.io';
import { getBaseDir } from "../../../common/utils/path.helper";
const fs = require('fs');
const path = require('path');

// const options = {
//   key: fs.readFileSync(path?.join( getBaseDir(), 'client_certs/key.pem')),
//   cert: fs.readFileSync(path?.join( getBaseDir(), 'client_certs/cert.pem')),
// };

@WebSocketGateway({
  namespace: 'ws/transport',
  // path: '/socket.io',
  transports: ['websocket', 'polling']
  // serveClient: true,

  // key: fs.readFileSync(path?.join( getBaseDir(), 'client_certs/key.pem')),
  // cert: fs.readFileSync(path?.join( getBaseDir(), 'client_certs/cert.pem')),
  // options: options,
  // cors: {
  //   credentials: false,
  //   allowedHeaders: headers,
  //   origin: whiteList,
  //   exposedHeaders: exposedHeaders,
  //   methods: methods,
  // }
})
export class TransportGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor() {

  }

  afterInit(server: any) {
    this.logger.log('Client afterInit');
    this.server.emit('message', 'Welcome to the server!');
  }

  private logger = new Logger('TransportGateway');

  // handleConnection(client) {
  //   this.logger.log('New client connected');
  //   client.emit('connection', 'Successfully connected to server');
  // }

  handleDisconnect(client) {
    this.server.emit('message', 'disconnected');
    this.logger.log('Client disconnected');
    // console.log('New client disconnected');
  }

  handleConnection(client) {
    // console.log('message', 'TransportGateway Welcome to the server!');
    client.emit('message', 'from TransportGateway Welcome to the server!');
    this.server.emit('message', 'from TransportGateway Welcome to the server!');
    this.logger.log('TransportGateway handleConnection');
    // console.log('TransportGateway handleConnection');
  }

  handleMessage(client, message) {
    this.server.emit('message', message);
    // console.log('Client disconnected');
    this.server.emit('message', 'Welcome to the server!');
    this.logger.log('Client disconnected');
  }

  @SubscribeMessage('message')
  handleMessage1(client: Socket, message: {
    sender: string, room: string, message: string
  }) {
    console.log('TransportGateway message handleMessage1', message);
    this.server.to(message.room).emit('chatToClient', message);
  }

  @SubscribeMessage('joinRoom')
  handleRoomJoin(client: Socket, room: string) {
    console.log('TransportGateway handleRoomJoin joinRoom', 'joinRoom', room);
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  handleRoomLeave(client: Socket, room: string) {
    console.log('TransportGateway handleRoomJoin leaveRoom', 'leaveRoom', room);
    client.leave(room);
    client.emit('leftRoom', room);
  }
}
