import { JobStatus, WorkModel } from '../schemas/job.schema';
export declare class CreateJobDto {
    title: string;
    department: string;
    location?: string;
    workModel?: WorkModel;
    status?: JobStatus;
    seniority?: string;
    summary?: string;
    mustHaveSkills?: string[];
    niceToHaveSkills?: string[];
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    hiringManager?: string;
    recruiter?: string;
    slug?: string;
    metaDescription?: string;
}
declare const UpdateJobDto_base: import("@nestjs/common").Type<Partial<CreateJobDto>>;
export declare class UpdateJobDto extends UpdateJobDto_base {
}
export declare class QueryJobDto {
    q?: string;
    status?: JobStatus;
}
export {};
