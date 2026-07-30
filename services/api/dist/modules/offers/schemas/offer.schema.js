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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferSchema = exports.Offer = exports.ApprovalStep = exports.OfferStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var OfferStatus;
(function (OfferStatus) {
    OfferStatus["Drafting"] = "drafting";
    OfferStatus["PendingApproval"] = "pending-approval";
    OfferStatus["Approved"] = "approved";
    OfferStatus["Sent"] = "sent";
    OfferStatus["Accepted"] = "accepted";
    OfferStatus["Declined"] = "declined";
    OfferStatus["Withdrawn"] = "withdrawn";
})(OfferStatus || (exports.OfferStatus = OfferStatus = {}));
let ApprovalStep = class ApprovalStep {
};
exports.ApprovalStep = ApprovalStep;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApprovalStep.prototype, "approver", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApprovalStep.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['pending', 'approved', 'rejected'], default: 'pending' }),
    __metadata("design:type", String)
], ApprovalStep.prototype, "decision", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ApprovalStep.prototype, "decidedAt", void 0);
exports.ApprovalStep = ApprovalStep = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ApprovalStep);
const ApprovalStepSchema = mongoose_1.SchemaFactory.createForClass(ApprovalStep);
let Offer = class Offer {
};
exports.Offer = Offer;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Candidate', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Offer.prototype, "candidateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Job', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Offer.prototype, "jobId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: OfferStatus, default: OfferStatus.Drafting, index: true }),
    __metadata("design:type", String)
], Offer.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Offer.prototype, "baseSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Offer.prototype, "bonus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Offer.prototype, "equity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'EUR' }),
    __metadata("design:type", String)
], Offer.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ApprovalStepSchema], default: [] }),
    __metadata("design:type", Array)
], Offer.prototype, "approvals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 100, default: 50 }),
    __metadata("design:type", Number)
], Offer.prototype, "acceptanceLikelihood", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Offer.prototype, "expiresAt", void 0);
exports.Offer = Offer = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'offers' })
], Offer);
exports.OfferSchema = mongoose_1.SchemaFactory.createForClass(Offer);
//# sourceMappingURL=offer.schema.js.map