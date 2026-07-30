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
exports.AssessmentSchema = exports.Assessment = exports.AssessmentKind = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var AssessmentKind;
(function (AssessmentKind) {
    AssessmentKind["Skills"] = "skills";
    AssessmentKind["Psychometric"] = "psychometric";
    AssessmentKind["Culture"] = "culture";
    AssessmentKind["Cognitive"] = "cognitive";
})(AssessmentKind || (exports.AssessmentKind = AssessmentKind = {}));
let Assessment = class Assessment {
};
exports.Assessment = Assessment;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Assessment.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AssessmentKind, required: true, index: true }),
    __metadata("design:type", String)
], Assessment.prototype, "kind", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Assessment.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Assessment.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Assessment.prototype, "proctored", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Assessment.prototype, "autoScored", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Assessment.prototype, "assigned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Assessment.prototype, "completed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], Assessment.prototype, "avgScore", void 0);
exports.Assessment = Assessment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'assessments' })
], Assessment);
exports.AssessmentSchema = mongoose_1.SchemaFactory.createForClass(Assessment);
//# sourceMappingURL=assessment.schema.js.map