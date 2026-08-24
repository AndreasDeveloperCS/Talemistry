import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'

import { exposedHeaders, headers, whiteList, methods } from '../../../config';
import { Observable, from, map } from 'rxjs';
import { getBaseDir } from '../../../common/utils/path.helper';
const fs = require('fs');
const path = require('path');
// const options = {
// key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
//   cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem')),
// };

@WebSocketGateway({
  namespace: 'interview',
  // path: '/sockets.io',
  transports: ['websocket', 'polling']
  // key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
  // cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem')),
  // httpsOptions: {
  //   key: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/key.pem')),
  //   cert: fs.readFileSync(path?.join(getBaseDir(), 'client_certs/cert.pem')),
  // },
  // options: options,

  // cors: {
  //   credentials: false,
  //   allowedHeaders: headers,
  //   origin: whiteList,
  //   exposedHeaders: exposedHeaders,
  //   methods: methods,
  // }
})
export class InterviewTaskGateway {

  @WebSocketServer()
  server: Server

  constructor() {
    // console.log('InterviewGateway');
    //console.log('InterviewGateway server', this.server);
  }

  @SubscribeMessage('push')
  onPush(@MessageBody() data) {
    // console.log('onPush', data);
    return {
      event: 'pop',
      data,
    };
  }

  @SubscribeMessage('message')
  message(@MessageBody() data) {
    // console.log('InterviewGateway handleConnection', 'message', data);
    return {
      event: 'message',
      data,
    };
  }

  handleConnection(client) {
    // console.log('InterviewGateway handleConnection', client);
    client.emit('message', 'Welcome to the server!');
  }

  handleMessage(client, message) {
    this.server.emit('message InterviewGateway', message);
  }

  @SubscribeMessage('message')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    // console.log('handleEvent', data);
    return data;
  }


  @SubscribeMessage('message')
  onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
    const event = 'message';
    const response = [1, 2, 3];
    // console.log('onEvent');
    return from(response).pipe(
      map(data => ({ event, data })),
    );
  }

}
