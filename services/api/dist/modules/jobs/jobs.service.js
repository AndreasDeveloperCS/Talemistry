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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const job_schema_1 = require("./schemas/job.schema");
let JobsService = class JobsService {
    constructor(model) {
        this.model = model;
    }
    create(dto) {
        return this.model.create({ ...dto, slug: dto.slug ?? this.slugify(dto.title) });
    }
    findAll(query) {
        const filter = {};
        if (query.q)
            filter.$text = { $search: query.q };
        if (query.status)
            filter.status = query.status;
        return this.model.find(filter).sort({ updatedAt: -1 }).lean();
    }
    async findOne(id) {
        const doc = await this.model.findById(id).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Job ${id} not found`);
        return doc;
    }
    async findBySlug(slug) {
        const doc = await this.model.findOne({ slug }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Job "${slug}" not found`);
        return doc;
    }
    async update(id, dto) {
        const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Job ${id} not found`);
        return doc;
    }
    async remove(id) {
        const res = await this.model.findByIdAndDelete(id);
        if (!res)
            throw new common_1.NotFoundException(`Job ${id} not found`);
        return { deleted: true, id };
    }
    slugify(input) {
        return input
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(job_schema_1.Job.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], JobsService);
//# sourceMappingURL=jobs.service.js.map