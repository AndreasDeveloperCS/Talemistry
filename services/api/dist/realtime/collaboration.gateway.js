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
var CollaborationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let CollaborationGateway = CollaborationGateway_1 = class CollaborationGateway {
    constructor() {
        this.logger = new common_1.Logger(CollaborationGateway_1.name);
        this.presence = new Map();
    }
    handleConnection(client) {
        this.logger.debug(`collab connect ${client.id}`);
    }
    handleDisconnect(client) {
        for (const [room, members] of this.presence) {
            if (members.delete(client.id)) {
                this.server.to(room).emit('presence', { room, count: members.size });
            }
        }
    }
    onJoin(client, room) {
        void client.join(room);
        const members = this.presence.get(room) ?? new Set();
        members.add(client.id);
        this.presence.set(room, members);
        this.server.to(room).emit('presence', { room, count: members.size });
        return { room, count: members.size };
    }
    onTyping(payload) {
        this.server.to(payload.room).emit('typing', payload);
    }
    onMessage(msg) {
        const enriched = { ...msg, at: new Date().toISOString() };
        this.server.to(msg.room).emit('message', enriched);
        return enriched;
    }
};
exports.CollaborationGateway = CollaborationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CollaborationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "onJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "onTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollaborationGateway.prototype, "onMessage", null);
exports.CollaborationGateway = CollaborationGateway = CollaborationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/collab', cors: { origin: true, credentials: true } })
], CollaborationGateway);
//# sourceMappingURL=collaboration.gateway.js.map