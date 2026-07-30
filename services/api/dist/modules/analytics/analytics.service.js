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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const candidate_schema_1 = require("../candidates/schemas/candidate.schema");
const job_schema_1 = require("../jobs/schemas/job.schema");
const offer_schema_1 = require("../offers/schemas/offer.schema");
const journey_1 = require("../../common/journey");
let AnalyticsService = class AnalyticsService {
    constructor(candidates, jobs, offers) {
        this.candidates = candidates;
        this.jobs = jobs;
        this.offers = offers;
    }
    async overview() {
        const [totalCandidates, openRoles, offersSent, accepted, avgMatchAgg, funnelAgg] = await Promise.all([
            this.candidates.countDocuments(),
            this.jobs.countDocuments({ status: job_schema_1.JobStatus.Published }),
            this.offers.countDocuments({ status: { $in: [offer_schema_1.OfferStatus.Sent, offer_schema_1.OfferStatus.Accepted] } }),
            this.offers.countDocuments({ status: offer_schema_1.OfferStatus.Accepted }),
            this.candidates.aggregate([
                { $group: { _id: null, avg: { $avg: '$matchScore' } } },
            ]),
            this.candidates.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
        ]);
        const funnelMap = new Map(funnelAgg.map((f) => [f._id, f.count]));
        const funnel = journey_1.JOURNEY_ORDER.map((stage) => ({
            stage,
            label: journey_1.JOURNEY_META[stage].label,
            count: funnelMap.get(stage) ?? 0,
        }));
        return {
            kpis: {
                totalCandidates,
                openRoles,
                offersSent,
                offerAcceptanceRate: offersSent ? Math.round((accepted / offersSent) * 100) : 0,
                avgChemistryMatch: Math.round(avgMatchAgg[0]?.avg ?? 0),
            },
            funnel,
        };
    }
    async sources() {
        return this.candidates.aggregate([
            { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { _id: 0, source: '$_id', count: 1 } },
        ]);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(candidate_schema_1.Candidate.name)),
    __param(1, (0, mongoose_1.InjectModel)(job_schema_1.Job.name)),
    __param(2, (0, mongoose_1.InjectModel)(offer_schema_1.Offer.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map