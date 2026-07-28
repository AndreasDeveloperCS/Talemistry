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
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const candidate_schema_1 = require("./schemas/candidate.schema");
let CandidatesService = class CandidatesService {
    constructor(model) {
        this.model = model;
    }
    async create(dto) {
        return this.model.create(dto);
    }
    async findAll(query) {
        const { q, stage, minMatch, page = 1, limit = 20 } = query;
        const filter = {};
        if (q)
            filter.$text = { $search: q };
        if (stage)
            filter.stage = stage;
        if (typeof minMatch === 'number')
            filter.matchScore = { $gte: minMatch };
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ matchScore: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            this.model.countDocuments(filter),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const doc = await this.model.findById(id).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Candidate ${id} not found`);
        return doc;
    }
    async update(id, dto) {
        const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Candidate ${id} not found`);
        return doc;
    }
    async moveToStage(id, stage) {
        const doc = await this.model.findByIdAndUpdate(id, { stage }, { new: true }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Candidate ${id} not found`);
        return doc;
    }
    async remove(id) {
        const res = await this.model.findByIdAndDelete(id);
        if (!res)
            throw new common_1.NotFoundException(`Candidate ${id} not found`);
        return { deleted: true, id };
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(candidate_schema_1.Candidate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map