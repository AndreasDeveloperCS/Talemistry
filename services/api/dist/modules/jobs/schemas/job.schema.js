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
exports.JobSchema = exports.Job = exports.WorkModel = exports.JobStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var JobStatus;
(function (JobStatus) {
    JobStatus["Draft"] = "draft";
    JobStatus["Published"] = "published";
    JobStatus["Paused"] = "paused";
    JobStatus["Closed"] = "closed";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var WorkModel;
(function (WorkModel) {
    WorkModel["Remote"] = "remote";
    WorkModel["Hybrid"] = "hybrid";
    WorkModel["Onsite"] = "onsite";
})(WorkModel || (exports.WorkModel = WorkModel = {}));
let Job = class Job {
};
exports.Job = Job;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Job.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Job.prototype, "department", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Job.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: WorkModel, default: WorkModel.Hybrid }),
    __metadata("design:type", String)
], Job.prototype, "workModel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: JobStatus, default: JobStatus.Draft, index: true }),
    __metadata("design:type", String)
], Job.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Job.prototype, "seniority", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Job.prototype, "summary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Job.prototype, "mustHaveSkills", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Job.prototype, "niceToHaveSkills", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "salaryMin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "salaryMax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'EUR' }),
    __metadata("design:type", String)
], Job.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "applicants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "inPipeline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 100, default: 0 }),
    __metadata("design:type", Number)
], Job.prototype, "healthScore", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Job.prototype, "hiringManager", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Job.prototype, "recruiter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true }),
    __metadata("design:type", String)
], Job.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Job.prototype, "metaDescription", void 0);
exports.Job = Job = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'jobs' })
], Job);
exports.JobSchema = mongoose_1.SchemaFactory.createForClass(Job);
exports.JobSchema.index({ title: 'text', summary: 'text', department: 'text' });
//# sourceMappingURL=job.schema.js.map