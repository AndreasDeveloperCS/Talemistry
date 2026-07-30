import { HydratedDocument } from 'mongoose';
import { JourneyStage, WorkStyleType } from '../../../common/journey';
export type CandidateDocument = HydratedDocument<Candidate>;
export declare class TalentElement {
    key: string;
    label: string;
    score: number;
}
export declare class VerifiedSkill {
    name: string;
    level: number;
    verified: boolean;
    source: string;
}
export declare class WorkStyleAxis {
    axis: string;
    value: number;
    leftLabel: string;
    rightLabel: string;
}
export declare class Candidate {
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    yearsExperience: number;
    matchScore: number;
    elements: TalentElement[];
    skills: VerifiedSkill[];
    workStyle: WorkStyleAxis[];
    workStyleType: WorkStyleType;
    stage: JourneyStage;
    tags: string[];
    summary: string;
    avatarTone: string;
    potentialSpectrum: number;
    appliedJobs: string[];
    consentGiven: boolean;
    consentAt: Date;
}
export declare const CandidateSchema: import("mongoose").Schema<Candidate, import("mongoose").Model<Candidate, any, any, any, import("mongoose").Document<unknown, any, Candidate, any, {}> & Candidate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Candidate, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Candidate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Candidate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
