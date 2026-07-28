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
exports.OffersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const offer_schema_1 = require("./schemas/offer.schema");
let OffersService = class OffersService {
    constructor(model) {
        this.model = model;
    }
    create(dto) {
        return this.model.create(dto);
    }
    findAll(status) {
        const filter = status ? { status } : {};
        return this.model.find(filter).sort({ updatedAt: -1 }).populate('candidateId jobId').lean();
    }
    async findOne(id) {
        const doc = await this.model.findById(id).populate('candidateId jobId').lean();
        if (!doc)
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        return doc;
    }
    async transition(id, status) {
        const doc = await this.model.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!doc)
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        return doc;
    }
    async approve(id, approver) {
        const offer = await this.model.findById(id);
        if (!offer)
            throw new common_1.NotFoundException(`Offer ${id} not found`);
        const step = offer.approvals.find((a) => a.approver === approver);
        if (step) {
            step.decision = 'approved';
            step.decidedAt = new Date();
        }
        if (offer.approvals.every((a) => a.decision === 'approved')) {
            offer.status = offer_schema_1.OfferStatus.Approved;
        }
        await offer.save();
        return offer.toObject();
    }
};
exports.OffersService = OffersService;
exports.OffersService = OffersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(offer_schema_1.Offer.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], OffersService);
//# sourceMappingURL=offers.service.js.map