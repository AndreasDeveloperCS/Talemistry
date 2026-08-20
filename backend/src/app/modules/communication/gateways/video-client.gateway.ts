import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class VideoClientGateway implements OnGatewayInit {

  @WebSocketServer()
  server: Server;

  private clientChannels: string[] = [];
  private stun: string = process.env.RTC_STUN_URLS?.split(',')?.[0]?.trim() || '';

  private iceServers: any[] = [];
  private channels = {};
  private sockets = {};
  private peers = {};

  constructor() {

    const stunUrls = (process.env.RTC_STUN_URLS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const url of stunUrls) {
      this.iceServers.push({ urls: url });
    }

    const turnEnabled = (process.env.RTC_TURN_ENABLED ?? 'false').toLowerCase() === 'true';
    const turnUsername = process.env.RTC_TURN_USERNAME;
    const turnCredential = process.env.RTC_TURN_PASSWORD;
    const turnUrls = (process.env.RTC_TURN_URLS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (turnEnabled && turnUsername && turnCredential && turnUrls.length) {
      for (const url of turnUrls) {
        this.iceServers.push({ urls: url, username: turnUsername, credential: turnCredential });
      }
    }

  }

  afterInit(server: any) {

  }

  handleConnection(socket: Socket) {
    const hostHeader = socket?.handshake?.headers?.host;
    const hostName = typeof hostHeader === 'string' ? hostHeader.split(':')[0] : 'unknown';
    console.log('[' + socket.id + '] connection accepted', { host: hostName });
    this.sockets[socket.id] = socket;
    const transport = socket.conn.transport.name;
    console.log('Transports: ', transport);
    socket.conn.on('upgrade', () => {
      const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
      console.log('[' + socket.id + '] Connection upgraded transport', upgradedTransport);
    });
  }

  async handleDisconnect(client: Socket) {
    console.log('Client disconnected');
    for (let channel in this.clientChannels) {
      await this.removePeerFrom(channel, client);
    }
  }

  @SubscribeMessage('join')
  async join(socket: Socket, config: any) {
    console.log('VideoClientGateway join');
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
    console.log('Channel: ', channel);

    if (channel in this.clientChannels) {
      return console.log('[' + socket.id + '] [Warning] already joined', channel);
    }

    // no channel aka room in channels init
    if (!(channel in this.channels)) {
      this.channels[channel] = {};
    }

    // no channel aka room in peers init
    if (!(channel in this.peers)) {
      this.peers[channel] = {};
    }

    // room locked by the participants can't join
    if (this.peers[channel]['lock'] === true && this.peers[channel]['password'] != channel_password) {
      console.log('[' + socket.id + '] [Warning] Room Is Locked', channel);
      return socket.emit('roomIsLocked');
    }

    // collect peers info grp by channels
    this.peers[channel][socket.id] = {
      peer_name: peer_name,
      peer_video: peer_video,
      peer_audio: peer_audio,
      peer_video_status: peer_video_status,
      peer_audio_status: peer_audio_status,
      peer_screen_status: peer_screen_status,
      peer_hand_status: peer_hand_status,
      peer_rec_status: peer_rec_status,
    };
    console.log('[Join] - connected peers grp by roomId', this.peers);

    await this.addPeerTo(channel, socket);

    this.channels[channel][socket.id] = socket;
    this.clientChannels[channel] = channel;

    // Send some server info to joined peer
    await this.sendToPeer(socket.id, 'serverInfo', { peers_count: Object.keys(this.peers[channel]).length });
  }

  @SubscribeMessage('relayIce')
  async relayIce(socket: Socket, config: any) {
    let peer_id = config.peer_id;
    let ice_candidate = config.ice_candidate;

    // log.debug('[' + socket.id + '] relay ICE-candidate to [' + peer_id + '] ', {
    //     address: config.ice_candidate,
    // });

    await this.sendToPeer(peer_id, 'iceCandidate', {
      peer_id: socket.id,
      ice_candidate: ice_candidate,
    });
  }

  @SubscribeMessage('relaySDP')
  async relaySDP(socket: Socket, config: any) {
    let peer_id = config.peer_id;
    let session_description = config.session_description;

    console.log('[' + socket.id + '] relay SessionDescription to [' + peer_id + '] ', {
      type: session_description.type,
    });

    await this.sendToPeer(peer_id, 'sessionDescription', {
      peer_id: socket.id,
      session_description: session_description,
    });
  }

  @SubscribeMessage('roomAction')
  async roomAction(socket: Socket, config: any) {
    let room_is_locked = false;
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let password = config.password;
    let action = config.action;

    console.log('roomAction');

    try {
      switch (action) {
        case 'lock':
          this.peers[room_id]['lock'] = true;
          this.peers[room_id]['password'] = password;
          await this.sendToRoom(room_id, socket.id, 'roomAction', {
            peer_name: peer_name,
            action: action,
          });
          room_is_locked = true;
          break;
        case 'unlock':
          delete this.peers[room_id]['lock'];
          delete this.peers[room_id]['password'];
          await this.sendToRoom(room_id, socket.id, 'roomAction', {
            peer_name: peer_name,
            action: action,
          });
          break;
        case 'checkPassword':
          let config = {
            peer_name: peer_name,
            action: action,
            password: password == this.peers[room_id]['password'] ? 'OK' : 'KO',
          };
          await this.sendToPeer(socket.id, 'roomAction', config);
          break;
      }
    } catch (err) {
      console.error('Room action', JSON.stringify(err));
    }
    console.log('[' + socket.id + '] Room ' + room_id, { locked: room_is_locked, password: password });
  }

  @SubscribeMessage('peerName')
  async peerName(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_name_old = config.peer_name_old;
    let peer_name_new = config.peer_name_new;
    let peer_id_to_update = null;

    for (let peer_id in this.peers[room_id]) {
      if (this.peers[room_id][peer_id]['peer_name'] == peer_name_old) {
        this.peers[room_id][peer_id]['peer_name'] = peer_name_new;
        peer_id_to_update = peer_id;
      }
    }

    if (peer_id_to_update) {
      console.log('[' + socket.id + '] emit peerName to [room_id: ' + room_id + ']', {
        peer_id: peer_id_to_update,
        peer_name: peer_name_new,
      });

      await this.sendToRoom(room_id, socket.id, 'peerName', {
        peer_id: peer_id_to_update,
        peer_name: peer_name_new,
      });
    }
  }

  @SubscribeMessage('peerStatus')
  async peerStatus(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let element = config.element;
    let status = config.status;
    try {
      for (let peer_id in this.peers[room_id]) {
        if (this.peers[room_id][peer_id]['peer_name'] == peer_name) {
          switch (element) {
            case 'video':
              this.peers[room_id][peer_id]['peer_video_status'] = status;
              break;
            case 'audio':
              this.peers[room_id][peer_id]['peer_audio_status'] = status;
              break;
            case 'screen':
              this.peers[room_id][peer_id]['peer_screen_status'] = status;
              break;
            case 'hand':
              this.peers[room_id][peer_id]['peer_hand_status'] = status;
              break;
            case 'rec':
              this.peers[room_id][peer_id]['peer_rec_status'] = status;
              break;
          }
        }
      }

      console.log('[' + socket.id + '] emit peerStatus to [room_id: ' + room_id + ']', {
        peer_id: socket.id,
        element: element,
        status: status,
      });

      await this.sendToRoom(room_id, socket.id, 'peerStatus', {
        peer_id: socket.id,
        peer_name: peer_name,
        element: element,
        status: status,
      });

    } catch (err) {
      console.error('Peer Status', JSON.stringify(err));
    }
  }

  @SubscribeMessage('peerAction')
  async peerAction(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_id = config.peer_id;
    let peer_name = config.peer_name;
    let peer_use_video = config.peer_use_video;
    let peer_action = config.peer_action;
    let send_to_all = config.send_to_all;

    if (send_to_all) {
      console.debug('[' + socket.id + '] emit peerAction to [room_id: ' + room_id + ']', {
        peer_id: socket.id,
        peer_name: peer_name,
        peer_action: peer_action,
        peer_use_video: peer_use_video,
      });

      await this.sendToRoom(room_id, socket.id, 'peerAction', {
        peer_id: peer_id,
        peer_name: peer_name,
        peer_action: peer_action,
        peer_use_video: peer_use_video,
      });
    } else {
      console.debug('[' + socket.id + '] emit peerAction to [' + peer_id + '] from room_id [' + room_id + ']');

      await this.sendToPeer(peer_id, 'peerAction', {
        peer_id: peer_id,
        peer_name: peer_name,
        peer_action: peer_action,
        peer_use_video: peer_use_video,
      });
    }
  }

  @SubscribeMessage('kickOut')
  async kickOut(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_id = config.peer_id;
    let peer_name = config.peer_name;

    console.debug('[' + socket.id + '] kick out peer [' + peer_id + '] from room_id [' + room_id + ']');

    await this.sendToPeer(peer_id, 'kickOut', {
      peer_name: peer_name,
    });
  }

  @SubscribeMessage('fileInfo')
  async fileInfo(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let peer_id = config.peer_id;
    let broadcast = config.broadcast;
    let file = config.file;

    function bytesToSize(bytes) {
      let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 Byte';
      let i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    }

    console.debug('[' + socket.id + '] Peer [' + peer_name + '] send file to room_id [' + room_id + ']', {
      peerName: file.peerName,
      fileName: file.fileName,
      fileSize: bytesToSize(file.fileSize),
      fileType: file.fileType,
      broadcast: broadcast,
    });

    if (broadcast) {
      await this.sendToRoom(room_id, socket.id, 'fileInfo', config);
    } else {
      await this.sendToPeer(peer_id, 'fileInfo', config);
    }
  }

  @SubscribeMessage('fileAbort')
  async fileAbort(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_name = config.peer_name;

    console.debug('[' + socket.id + '] Peer [' + peer_name + '] send fileAbort to room_id [' + room_id + ']');
    await this.sendToRoom(room_id, socket.id, 'fileAbort');
  }

  @SubscribeMessage('videoPlayer')
  async videoPlayer(socket: Socket, config: any) {
    let room_id = config.room_id;
    let peer_name = config.peer_name;
    let video_action = config.video_action;
    let video_src = config.video_src;
    let peer_id = config.peer_id;

    let sendConfig = {
      peer_name: peer_name,
      video_action: video_action,
      video_src: video_src,
    };
    let logMe = {
      peer_id: socket.id,
      peer_name: peer_name,
      video_action: video_action,
      video_src: video_src,
    };

    if (peer_id) {
      console.debug(
        '[' + socket.id + '] emit videoPlayer to [' + peer_id + '] from room_id [' + room_id + ']',
        logMe,
      );

      await this.sendToPeer(peer_id, 'videoPlayer', sendConfig);
    } else {
      console.debug('[' + socket.id + '] emit videoPlayer to [room_id: ' + room_id + ']', logMe);

      await this.sendToRoom(room_id, socket.id, 'videoPlayer', sendConfig);
    }
  }

  @SubscribeMessage('wbCanvasToJson')
  async wbCanvasToJson(socket: Socket, config: any) {
    let room_id = config.room_id;
    await this.sendToRoom(room_id, socket.id, 'wbCanvasToJson', config);
  }

  @SubscribeMessage('whiteboardAction')
  async whiteboardAction(socket: Socket, config: any) {
    console.debug('Whiteboard', config);
    let room_id = config.room_id;
    await this.sendToRoom(room_id, socket.id, 'whiteboardAction', config);
  }
  //#region private methods
  private async sendToRoom(roomId: string, socketId: string, msg: string, config: object = {}) {
    for (let peer_id in this.channels[roomId]) {
      // not send data to myself
      if (peer_id != socketId)
        await this.channels[roomId][peer_id].emit(msg, config);
    }
  }

  private async sendToPeer(peerId: string, msg: string, config: object = {}): Promise<void> {
    if (peerId in this.sockets)
      await this.sockets[peerId].emit(msg, config);
  }

  private async addPeerTo(channel: string, socket: Socket) {
    for (let id in this.channels[channel]) {
      // offer false
      await this.channels[channel][id].emit('addPeer', {
        peer_id: socket.id,
        peers: this.peers[channel],
        should_create_offer: false,
        iceServers: this.iceServers,
      });
      // offer true
      socket.emit('addPeer', {
        peer_id: id,
        peers: this.peers[channel],
        should_create_offer: true,
        iceServers: this.iceServers,
      });
      console.log('[' + socket.id + '] emit addPeer [' + id + ']');
    }
  }

  private async removePeerFrom(channel: string, socket: Socket) {
    console.log('VideoClientGateway removePeerFrom');

    if (!(channel in this.clientChannels)) {
      return console.log('[' + socket.id + '] [Warning] not in ', channel);
    }

    try {
      delete this.clientChannels[channel];
      delete this.channels[channel][socket.id];
      delete this.peers[channel][socket.id]; // delete peer data from the room

      switch (Object.keys(this.peers[channel]).length) {
        case 0: // last peer disconnected from the room without room lock & password set
          delete this.peers[channel];
          break;
        case 2: // last peer disconnected from the room having room lock & password set
          if (this.peers[channel]['lock'] && this.peers[channel]['password']) {
            delete this.peers[channel]; // clean lock and password value from the room
          }
          break;
      }
    } catch (err) {
      console.log('Remove Peer', JSON.stringify(err));
    }

    console.log('[removePeerFrom] - connected peers grp by roomId', this.peers);

    for (let id in this.channels[channel]) {
      await this.channels[channel][id].emit('removePeer', { peer_id: socket.id });
      socket.emit('removePeer', { peer_id: id });
      console.log('[' + socket.id + '] emit removePeer [' + id + ']');
    }
  }
  //#endregion
}
