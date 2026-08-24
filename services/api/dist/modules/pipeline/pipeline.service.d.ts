import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { CandidatesService } from '../candidates/candidates.service';
import { JourneyStage } from '../../common/journey';
export interface PipelineColumn {
    stage: JourneyStage;
    label: string;
    promise: string;
    count: number;
    candidates: Candidate[];
}
export declare class PipelineService {
    private readonly model;
    private readonly candidates;
    constructor(model: Model<CandidateDocument>, candidates: CandidatesService);
    board(jobId?: string): Promise<PipelineColumn[]>;
    move(candidateId: string, stage: JourneyStage): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    funnel(jobId?: string): Promise<{
        stage: JourneyStage;
        label: string;
        count: number;
    }[]>;
}
