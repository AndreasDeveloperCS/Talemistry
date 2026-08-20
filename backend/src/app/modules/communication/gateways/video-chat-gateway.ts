import { Logger, Req, Res } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { exposedHeaders, headers, methods, whiteList } from '../../../config';
import { getBaseDir } from '../../../common/utils/path.helper';
const path = require('path');
var socketStream = require('socket.io-stream');

@WebSocketGateway({
  namespace: 'ws/video-chat',
  //path: '/socket.io',
  //maxHttpBufferSize: 1e7,
  transports: ['websocket', 'polling']
  // serveClient: true,

  // key: fs.readFileSync(path?.join( getBaseDir(), 'client_certs/key.pem')),
  // cert: fs.readFileSync(path?.join( getBaseDir(),'client_certs/cert.pem')),
  // options: options,
  // cors: {
  //   credentials: false,
  //   allowedHeaders: headers,
  //   origin: whiteList,
  //   exposedHeaders: exposedHeaders,
  //   methods: methods,
  // }
})
export class VideoChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  // html views
  views = {
    client: path.join(getBaseDir('src/public/views/client.html'), 'src/public/views/client.html'),
    landing: path.join(getBaseDir('src/public/views/landing.html'), 'src/public/views/landing.html'),
    newCall: path.join(getBaseDir('src/public/views/newcall.html'), 'src/public/views/newcall.html'),
    notFound: path.join(getBaseDir('src/public/views/404.html'), 'src/public/views/404.html'),
  };

  channels = {}; // collect channels
  sockets = {}; // collect sockets
  peers = {}; // collect peers info grp by channels

  @WebSocketServer()
  server: Server;

  constructor() {
    // console.log('VideoChatGateway');
  }

  afterInit(server: any) {
    this.logger.log('Client afterInit');
    this.server.emit('message', 'Welcome to the server!');
    // console.log('New client afterInit');
  }

  private logger = new Logger('VideoChatGateway');

  handleDisconnect(client) {
    this.server.emit('message', 'disconnected');
    this.logger.log('Client disconnected');
    // console.log('New client disconnected 44');
  }


  handleConnection(client, @Req() req: Request, @Res() res: Response) {
    // console.log('message', 'VideoChatGateway Welcome to the server!');
    client.emit('message', 'from VideoChatGateway Welcome to the server!');
    this.server.emit('message', 'from VideoChatGateway Welcome to the server!');
    // console.log('VideoChatGateway handleConnection 52');
    // const file = createReadStream(join( getBaseDir(), this.views.landing));
    // file.pipe(res);
    client.emit('message', this.views.landing);
    //res.sendFile(this.views.landing);
  }

  @SubscribeMessage('video-content-first')
  handleMessage(client: Socket, videoContent: any) {
    this.server.emit('videoContent', videoContent);
    this.logger.log('videoContent');
  }

  @SubscribeMessage('video-content')
  handleMessage1(client: Socket, message: {
    sender: string, room: string, message: string
  }) {
    // console.log('VideoChatGateway message handleMessage1', message);
    this.server.to(message.room).emit('chatToClient', message);
  }

  @SubscribeMessage('video-content')
  handleEvent(
    @MessageBody() data: {
      sender: string, room: string, message: string
    },
    @ConnectedSocket() client: Socket,
  ): {
    sender: string, room: string, message: string
  } {
    return data;
  }

  @SubscribeMessage('joinVideoRoom')
  handleRoomJoin(client: Socket, room: string) {
    // console.log('VideoChatGateway handleRoomJoin joinRoom', 'joinRoom', room);
    client.join(room);
    client.emit('joinVideoRoom', this.views.landing);
  }

  @SubscribeMessage('leaveVideoRoom')
  handleRoomLeave(client: Socket, room: string) {
    // console.log('VideoChatGateway handleRoomJoin leaveRoom', 'leaveRoom', room);
    client.leave(room);
    client.emit('leftRoom', room);
  }


  @SubscribeMessage(`video-content-data-exchange`)
  videoContentDataExchange(client: Socket, payload: any) {

    // console.log('video-content-data-exchange', payload);
    //client.emit(`video-content-data-exchange-${payload.roomName}`, payload);
    //this.server.emit(`video-content-data-exchange-${payload.roomName}`, payload);
  }

  @SubscribeMessage('room_join_request')
  roomJoinRequest(client: Socket, payload: any) {

    // console.log('room_join_request');

    try {
      // console.log('roomJoinRequest', payload);
      this.server.socketsJoin(payload.roomName);
      client.join(payload.roomName);
      //this.server.emit(`room_users-${payload.roomName}`, { signalData: payload.signalData, callerId: payload.callerId });
    } catch (err: any) {
      (err: any) => {
        // console.log('error roomJoinRequest', payload.roomName);

        if (!err) {
          // console.log('error roomJoinRequest', err);

          const room = this.server.in(payload.roomName);
          room.to(payload.roomName);

          client.in(payload.roomName).emit('room_users', client);

          //clients((err, client: Socket) => {
          if (!err) {
            client.in(payload.roomName).emit('room_users', client)
          }
        }
      }
    }
  }

  @SubscribeMessage('room_users')
  roomUsers(client: Socket, payload: any) {
    // console.log(`room_users-${payload.roomName}`, payload);
    this.server.on(`room_users-${payload.roomName}`, payload => {
      this.server.to(payload.calleeId).emit(`room_users-${payload.roomName}`, { signalData: payload.signalData, callerId: payload.callerId });
      this.server.emit(`room_users-${payload.roomName}`, { signalData: payload.signalData, callerId: payload.callerId });
    });
  }

  @SubscribeMessage('offer_signal')
  offerSignal(client: Socket, payload: any) {
    // console.log(`offer_signal-${payload.calleeId}`, payload);

    this.server.on('offer_signal', payload => {
      this.server.to(payload.calleeId).emit(`offer_signal-${payload.calleeId}`, { signalData: payload.signalData, callerId: payload.callerId });
      this.server.emit(`offer_signal-${payload.calleeId}`, { signalData: payload.signalData, callerId: payload.callerId });
    });
  }


  @SubscribeMessage('answer_signal')
  answerSignal(client: Socket, payload: any) {
    // console.log(`answer_signal-${payload.calleeId}`, payload);

    // console.log('answer_signal', payload);

    this.server.on('answer_signal', payload => {
      this.server.to(payload.callerId).emit(`answer_signal-${payload.calleeId}`, { signalData: payload.signalData, calleeId: client.id });
      this.server.emit(`answer_signal-${payload.calleeId}`, { signalData: payload.signalData, callerId: payload.callerId });
    });

  }


  @SubscribeMessage('disconnect')
  disconnect(payload: any) {
    this.server.on('disconnect', () => {
    });
  }

  @SubscribeMessage('joinVideoChat')
  joinVideoChat(socket: Socket, room: string, config: any) {
    // socket.on('join', async (config) => {
    // log.debug('Join room', config);
    //log.debug('[' + client.id + '] join ', config);

    let channel = config.channel;
    let channel_password = config.channel_password;
    let peer_name = config.peer_name;
    let peer_video = config.peer_video;
    let peer_audio = config.peer_audio;
    let peer_video_status = config.peer_video_status;
    let peer_audio_status = config.peer_audio_status;
    let peer_screen_status = config.peer_screen_status;
    let peer_hand_status = config.peer_hand_status;
    let peer_rec_status = config.peer_rec_status;

    // no channel aka room in channels init
    // if (!(channel in channels))
    //   channels[channel] = {};

    // // no channel aka room in peers init
    // if (!(channel in peers)) peers[channel] = {};

    // // room locked by the participants can't join
    // if (peers[channel]['lock'] === true && peers[channel]['password'] != channel_password) {
    //     log.debug('[' + socket.id + '] [Warning] Room Is Locked', channel);
    //     return socket.emit('roomIsLocked');
    // }

    // // collect peers info grp by channels
    // peers[channel][socket.id] = {
    //     peer_name: peer_name,
    //     peer_video: peer_video,
    //     peer_audio: peer_audio,
    //     peer_video_status: peer_video_status,
    //     peer_audio_status: peer_audio_status,
    //     peer_screen_status: peer_screen_status,
    //     peer_hand_status: peer_hand_status,
    //     peer_rec_status: peer_rec_status,
    // };
    // log.debug('[Join] - connected peers grp by roomId', peers);

    // await addPeerTo(channel);

    // channels[channel][socket.id] = socket;
    // socket.channels[channel] = channel;

    // // Send some server info to joined peer
    // await sendToPeer(socket.id, sockets, 'serverInfo', { peers_count: Object.keys(peers[channel]).length });
  };

  //  app.get(['/'], (req, res) => {
  //       res.sendFile(views.landing);
  //   });

  //   // set new room name and join
  //   app.get(['/newcall'], (req, res) => {
  //       res.sendFile(views.newCall);
  //   });

  //   // no room name specified to join
  //   app.get('/join/', (req, res) => {
  //       if (Object.keys(req.query).length > 0) {
  //           log.debug('Request Query', req.query);
  //           const { room, name, audio, video, screen, notify } = req.query;
  //           // all the params are mandatory for the direct room join
  //           if (room && name && audio && video && screen && notify) {
  //               return res.sendFile(views.client);
  //           }
  //       }
  //       res.redirect('/');
  //   });

  //   // Join Room *
  //   app.get('/join/*', (req, res) => {
  //       res.sendFile(views.client);
  //   });

}
