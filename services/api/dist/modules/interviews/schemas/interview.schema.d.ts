import { HydratedDocument, Types } from 'mongoose';
export type InterviewDocument = HydratedDocument<Interview>;
export declare enum InterviewType {
    Screen = "screen",
    Technical = "technical",
    LiveCoding = "live-coding",
    SystemDesign = "system-design",
    Behavioral = "behavioral",
    Panel = "panel",
    Final = "final"
}
export declare enum InterviewStatus {
    Scheduled = "scheduled",
    Live = "live",
    Completed = "completed",
    Cancelled = "cancelled"
}
export declare class ScorecardCriterion {
    competency: string;
    rating: number;
    weight: number;
    note: string;
}
export declare class Interview {
    candidateId: Types.ObjectId;
    jobId: Types.ObjectId;
    type: InterviewType;
    status: InterviewStatus;
    scheduledAt: Date;
    durationMinutes: number;
    interviewers: string[];
    roomId: string;
    scorecard: ScorecardCriterion[];
    recommendation: string;
    notes: string;
}
export declare const InterviewSchema: import("mongoose").Schema<Interview, import("mongoose").Model<Interview, any, any, any, import("mongoose").Document<unknown, any, Interview, any, {}> & Interview & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Interview, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Interview>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Interview> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
