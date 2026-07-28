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
exports.PipelineService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const candidate_schema_1 = require("../candidates/schemas/candidate.schema");
const candidates_service_1 = require("../candidates/candidates.service");
const journey_1 = require("../../common/journey");
let PipelineService = class PipelineService {
    constructor(model, candidates) {
        this.model = model;
        this.candidates = candidates;
    }
    async board(jobId) {
        const filter = jobId ? { appliedJobs: jobId } : {};
        const all = await this.model.find(filter).sort({ matchScore: -1 }).lean();
        return journey_1.JOURNEY_ORDER.map((stage) => {
            const candidates = all.filter((c) => c.stage === stage);
            return {
                stage,
                label: journey_1.JOURNEY_META[stage].label,
                promise: journey_1.JOURNEY_META[stage].promise,
                count: candidates.length,
                candidates: candidates,
            };
        });
    }
    move(candidateId, stage) {
        return this.candidates.moveToStage(candidateId, stage);
    }
    async funnel(jobId) {
        const board = await this.board(jobId);
        return board.map((c) => ({ stage: c.stage, label: c.label, count: c.count }));
    }
};
exports.PipelineService = PipelineService;
exports.PipelineService = PipelineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(candidate_schema_1.Candidate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        candidates_service_1.CandidatesService])
], PipelineService);
//# sourceMappingURL=pipeline.service.js.map