"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const configuration_1 = __importDefault(require("./config/configuration"));
const candidates_module_1 = require("./modules/candidates/candidates.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const pipeline_module_1 = require("./modules/pipeline/pipeline.module");
const interviews_module_1 = require("./modules/interviews/interviews.module");
const offers_module_1 = require("./modules/offers/offers.module");
const assessments_module_1 = require("./modules/assessments/assessments.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const realtime_module_1 = require("./realtime/realtime.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.get('mongoUri', { infer: true }),
                    dbName: config.get('dbName', { infer: true }),
                }),
            }),
            candidates_module_1.CandidatesModule,
            jobs_module_1.JobsModule,
            pipeline_module_1.PipelineModule,
            interviews_module_1.InterviewsModule,
            offers_module_1.OffersModule,
            assessments_module_1.AssessmentsModule,
            analytics_module_1.AnalyticsModule,
            realtime_module_1.RealtimeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map