import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { WsRegistry } from '../services/ws-registry.service';

@WebSocketGateway({
    namespace: '/ws/notify',
    transports: ['websocket', 'polling']
})
export class NotifyGateway implements OnGatewayInit {

    @WebSocketServer()
    nsp: Namespace;

    constructor(private readonly registry: WsRegistry) { }

    afterInit(nsp: Namespace) {
        this.registry.register('notify', nsp);
        console.log('ChatGateway OnGatewayInit', nsp.sockets);
    }
}