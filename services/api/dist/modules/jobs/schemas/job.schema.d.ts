import { HydratedDocument } from 'mongoose';
export type JobDocument = HydratedDocument<Job>;
export declare enum JobStatus {
    Draft = "draft",
    Published = "published",
    Paused = "paused",
    Closed = "closed"
}
export declare enum WorkModel {
    Remote = "remote",
    Hybrid = "hybrid",
    Onsite = "onsite"
}
export declare class Job {
    title: string;
    department: string;
    location: string;
    workModel: WorkModel;
    status: JobStatus;
    seniority: string;
    summary: string;
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    salaryMin: number;
    salaryMax: number;
    currency: string;
    applicants: number;
    inPipeline: number;
    healthScore: number;
    hiringManager: string;
    recruiter: string;
    slug: string;
    metaDescription: string;
}
export declare const JobSchema: import("mongoose").Schema<Job, import("mongoose").Model<Job, any, any, any, import("mongoose").Document<unknown, any, Job, any, {}> & Job & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Job, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Job>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Job> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
