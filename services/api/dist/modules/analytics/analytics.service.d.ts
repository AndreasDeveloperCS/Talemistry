import { Model } from 'mongoose';
import { CandidateDocument } from '../candidates/schemas/candidate.schema';
import { JobDocument } from '../jobs/schemas/job.schema';
import { OfferDocument } from '../offers/schemas/offer.schema';
export declare class AnalyticsService {
    private readonly candidates;
    private readonly jobs;
    private readonly offers;
    constructor(candidates: Model<CandidateDocument>, jobs: Model<JobDocument>, offers: Model<OfferDocument>);
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
