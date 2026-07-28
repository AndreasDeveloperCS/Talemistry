"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SignalingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let SignalingGateway = SignalingGateway_1 = class SignalingGateway {
    constructor() {
        this.logger = new common_1.Logger(SignalingGateway_1.name);
        this.rooms = new Map();
    }
    onJoin(client, payload) {
        const { room, peerId } = payload;
        void client.join(room);
        const peers = this.rooms.get(room) ?? new Set();
        const existing = [...peers];
        peers.add(peerId);
        this.rooms.set(room, peers);
        client.data.peerId = peerId;
        client.data.room = room;
        client.to(room).emit('peer:joined', { peerId });
        this.logger.debug(`peer ${peerId} joined rtc room ${room}`);
        return { room, peers: existing };
    }
    onOffer(payload) {
        this.server.to(payload.room).emit('offer', payload);
    }
    onAnswer(payload) {
        this.server.to(payload.room).emit('answer', payload);
    }
    onIce(payload) {
        this.server.to(payload.room).emit('ice-candidate', payload);
    }
    handleDisconnect(client) {
        const room = client.data?.room;
        const peerId = client.data?.peerId;
        if (room && peerId) {
            this.rooms.get(room)?.delete(peerId);
            client.to(room).emit('peer:left', { peerId });
        }
    }
};
exports.SignalingGateway = SignalingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SignalingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SignalingGateway.prototype, "onJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('offer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignalingGateway.prototype, "onOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('answer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignalingGateway.prototype, "onAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ice-candidate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignalingGateway.prototype, "onIce", null);
exports.SignalingGateway = SignalingGateway = SignalingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/rtc', cors: { origin: true, credentials: true } })
], SignalingGateway);
//# sourceMappingURL=signaling.gateway.js.map