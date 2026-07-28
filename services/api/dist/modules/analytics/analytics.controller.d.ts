import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly service;
    constructor(service: AnalyticsService);
    overview(): Promise<{
        kpis: {
            totalCandidates: number;
            openRoles: number;
            offersSent: number;
            offerAcceptanceRate: number;
            avgChemistryMatch: number;
        };
        funnel: {
            stage: import("../../common/journey").JourneyStage;
            label: string;
            count: number;
        }[];
    }>;
    sources(): Promise<any[]>;
}
