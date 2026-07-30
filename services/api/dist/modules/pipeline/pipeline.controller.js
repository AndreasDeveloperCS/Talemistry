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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pipeline_service_1 = require("./pipeline.service");
const pipeline_gateway_1 = require("../../realtime/pipeline.gateway");
const journey_1 = require("../../common/journey");
class MoveDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(journey_1.JourneyStage),
    __metadata("design:type", String)
], MoveDto.prototype, "stage", void 0);
let PipelineController = class PipelineController {
    constructor(service, gateway) {
        this.service = service;
        this.gateway = gateway;
    }
    board(jobId) {
        return this.service.board(jobId);
    }
    funnel(jobId) {
        return this.service.funnel(jobId);
    }
    async move(id, dto) {
        const updated = await this.service.move(id, dto.stage);
        this.gateway.broadcastMove({ candidateId: id, stage: dto.stage });
        return updated;
    }
};
exports.PipelineController = PipelineController;
__decorate([
    (0, common_1.Get)('board'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "board", null);
__decorate([
    (0, common_1.Get)('funnel'),
    __param(0, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "funnel", null);
__decorate([
    (0, common_1.Patch)('candidates/:id/move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MoveDto]),
    __metadata("design:returntype", Promise)
], PipelineController.prototype, "move", null);
exports.PipelineController = PipelineController = __decorate([
    (0, swagger_1.ApiTags)('pipeline'),
    (0, common_1.Controller)('pipeline'),
    __metadata("design:paramtypes", [pipeline_service_1.PipelineService,
        pipeline_gateway_1.PipelineGateway])
], PipelineController);
//# sourceMappingURL=pipeline.controller.js.map