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
exports.CandidateSchema = exports.Candidate = exports.WorkStyleAxis = exports.VerifiedSkill = exports.TalentElement = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const journey_1 = require("../../../common/journey");
let TalentElement = class TalentElement {
};
exports.TalentElement = TalentElement;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TalentElement.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], TalentElement.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], TalentElement.prototype, "score", void 0);
exports.TalentElement = TalentElement = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], TalentElement);
const TalentElementSchema = mongoose_1.SchemaFactory.createForClass(TalentElement);
let VerifiedSkill = class VerifiedSkill {
};
exports.VerifiedSkill = VerifiedSkill;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], VerifiedSkill.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], VerifiedSkill.prototype, "level", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], VerifiedSkill.prototype, "verified", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], VerifiedSkill.prototype, "source", void 0);
exports.VerifiedSkill = VerifiedSkill = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], VerifiedSkill);
const VerifiedSkillSchema = mongoose_1.SchemaFactory.createForClass(VerifiedSkill);
let WorkStyleAxis = class WorkStyleAxis {
};
exports.WorkStyleAxis = WorkStyleAxis;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkStyleAxis.prototype, "axis", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], WorkStyleAxis.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkStyleAxis.prototype, "leftLabel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkStyleAxis.prototype, "rightLabel", void 0);
exports.WorkStyleAxis = WorkStyleAxis = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], WorkStyleAxis);
const WorkStyleAxisSchema = mongoose_1.SchemaFactory.createForClass(WorkStyleAxis);
let Candidate = class Candidate {
};
exports.Candidate = Candidate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Candidate.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Candidate.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Candidate.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ lowercase: true, trim: true }),
    __metadata("design:type", String)
], Candidate.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Candidate.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Candidate.prototype, "yearsExperience", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100, index: true }),
    __metadata("design:type", Number)
], Candidate.prototype, "matchScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [TalentElementSchema], default: [] }),
    __metadata("design:type", Array)
], Candidate.prototype, "elements", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [VerifiedSkillSchema], default: [] }),
    __metadata("design:type", Array)
], Candidate.prototype, "skills", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [WorkStyleAxisSchema], default: [] }),
    __metadata("design:type", Array)
], Candidate.prototype, "workStyle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: journey_1.WorkStyleType }),
    __metadata("design:type", String)
], Candidate.prototype, "workStyleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: journey_1.JourneyStage, default: journey_1.JourneyStage.Understand, index: true }),
    __metadata("design:type", String)
], Candidate.prototype, "stage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Candidate.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Candidate.prototype, "summary", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Candidate.prototype, "avatarTone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 100 }),
    __metadata("design:type", Number)
], Candidate.prototype, "potentialSpectrum", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: 'ObjectId', ref: 'Job' }], default: [] }),
    __metadata("design:type", Array)
], Candidate.prototype, "appliedJobs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Candidate.prototype, "consentGiven", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Candidate.prototype, "consentAt", void 0);
exports.Candidate = Candidate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'candidates' })
], Candidate);
exports.CandidateSchema = mongoose_1.SchemaFactory.createForClass(Candidate);
exports.CandidateSchema.index({ name: 'text', title: 'text', summary: 'text' });
//# sourceMappingURL=candidate.schema.js.map