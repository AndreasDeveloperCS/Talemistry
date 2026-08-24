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
var PipelineGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let PipelineGateway = PipelineGateway_1 = class PipelineGateway {
    constructor() {
        this.logger = new common_1.Logger(PipelineGateway_1.name);
    }
    onJoin(client, jobId) {
        const room = jobId ? `job:${jobId}` : 'board:all';
        void client.join(room);
        this.logger.debug(`${client.id} joined ${room}`);
        return { joined: room };
    }
    onMove(event) {
        this.broadcastMove(event);
        return { ok: true };
    }
    broadcastMove(event) {
        this.server.emit('candidate:moved', event);
    }
};
exports.PipelineGateway = PipelineGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PipelineGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], PipelineGateway.prototype, "onJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('move'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PipelineGateway.prototype, "onMove", null);
exports.PipelineGateway = PipelineGateway = PipelineGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/pipeline', cors: { origin: true, credentials: true } })
], PipelineGateway);
//# sourceMappingURL=pipeline.gateway.js.map