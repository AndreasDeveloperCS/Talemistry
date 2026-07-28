import { PipelineService } from './pipeline.service';
import { PipelineGateway } from '../../realtime/pipeline.gateway';
import { JourneyStage } from '../../common/journey';
declare class MoveDto {
    stage: JourneyStage;
}
export declare class PipelineController {
    private readonly service;
    private readonly gateway;
    constructor(service: PipelineService, gateway: PipelineGateway);
    board(jobId?: string): Promise<import("./pipeline.service").PipelineColumn[]>;
    funnel(jobId?: string): Promise<{
        stage: JourneyStage;
        label: string;
        count: number;
    }[]>;
    move(id: string, dto: MoveDto): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("../candidates/schemas/candidate.schema").Candidate, {}, {}> & import("../candidates/schemas/candidate.schema").Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
export {};
