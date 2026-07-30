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
exports.InterviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const interview_schema_1 = require("./schemas/interview.schema");
let InterviewsService = class InterviewsService {
    constructor(model) {
        this.model = model;
    }
    create(dto) {
        return this.model.create({ ...dto, roomId: dto.roomId ?? `room-${(0, crypto_1.randomUUID)()}` });
    }
    findAll(status) {
        const filter = status ? { status } : {};
        return this.model.find(filter).sort({ scheduledAt: 1 }).populate('candidateId').lean();
    }
    async findOne(id) {
        const doc = await this.model.findById(id).populate('candidateId').lean();
        if (!doc)
            throw new common_1.NotFoundException(`Interview ${id} not found`);
        return doc;
    }
    async update(id, dto) {
        const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Interview ${id} not found`);
        return doc;
    }
    submitScorecard(id, scorecard, recommendation) {
        return this.update(id, { scorecard, recommendation, status: interview_schema_1.InterviewStatus.Completed });
    }
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(interview_schema_1.Interview.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], InterviewsService);
//# sourceMappingURL=interviews.service.js.map