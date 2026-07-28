"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const candidates_module_1 = require("../candidates/candidates.module");
const jobs_module_1 = require("../jobs/jobs.module");
const offers_module_1 = require("../offers/offers.module");
const mongoose_1 = require("@nestjs/mongoose");
const offer_schema_1 = require("../offers/schemas/offer.schema");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const live_analytics_controller_1 = require("./live-analytics.controller");
const live_analytics_service_1 = require("./live-analytics.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            candidates_module_1.CandidatesModule,
            jobs_module_1.JobsModule,
            offers_module_1.OffersModule,
            mongoose_1.MongooseModule.forFeature([{ name: offer_schema_1.Offer.name, schema: offer_schema_1.OfferSchema }]),
        ],
        controllers: [analytics_controller_1.AnalyticsController, live_analytics_controller_1.LiveAnalyticsController],
        providers: [analytics_service_1.AnalyticsService, live_analytics_service_1.LiveAnalyticsService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map