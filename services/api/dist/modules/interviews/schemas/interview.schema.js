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
exports.InterviewSchema = exports.Interview = exports.ScorecardCriterion = exports.InterviewStatus = exports.InterviewType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var InterviewType;
(function (InterviewType) {
    InterviewType["Screen"] = "screen";
    InterviewType["Technical"] = "technical";
    InterviewType["LiveCoding"] = "live-coding";
    InterviewType["SystemDesign"] = "system-design";
    InterviewType["Behavioral"] = "behavioral";
    InterviewType["Panel"] = "panel";
    InterviewType["Final"] = "final";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
var InterviewStatus;
(function (InterviewStatus) {
    InterviewStatus["Scheduled"] = "scheduled";
    InterviewStatus["Live"] = "live";
    InterviewStatus["Completed"] = "completed";
    InterviewStatus["Cancelled"] = "cancelled";
})(InterviewStatus || (exports.InterviewStatus = InterviewStatus = {}));
let ScorecardCriterion = class ScorecardCriterion {
};
exports.ScorecardCriterion = ScorecardCriterion;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScorecardCriterion.prototype, "competency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 4 }),
    __metadata("design:type", Number)
], ScorecardCriterion.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], ScorecardCriterion.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ScorecardCriterion.prototype, "note", void 0);
exports.ScorecardCriterion = ScorecardCriterion = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ScorecardCriterion);
const ScorecardCriterionSchema = mongoose_1.SchemaFactory.createForClass(ScorecardCriterion);
let Interview = class Interview {
};
exports.Interview = Interview;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Candidate', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Interview.prototype, "candidateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Job', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Interview.prototype, "jobId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: InterviewType, required: true }),
    __metadata("design:type", String)
], Interview.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: InterviewStatus, default: InterviewStatus.Scheduled, index: true }),
    __metadata("design:type", String)
], Interview.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Interview.prototype, "scheduledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 45 }),
    __metadata("design:type", Number)
], Interview.prototype, "durationMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Interview.prototype, "interviewers", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ScorecardCriterionSchema], default: [] }),
    __metadata("design:type", Array)
], Interview.prototype, "scorecard", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "recommendation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Interview.prototype, "notes", void 0);
exports.Interview = Interview = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'interviews' })
], Interview);
exports.InterviewSchema = mongoose_1.SchemaFactory.createForClass(Interview);
//# sourceMappingURL=interview.schema.js.map