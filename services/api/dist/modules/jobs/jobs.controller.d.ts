import { JobsService } from './jobs.service';
import { CreateJobDto, QueryJobDto, UpdateJobDto } from './dto/job.dto';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    create(dto: CreateJobDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(query: QueryJobDto): import("mongoose").Query<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[], import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>, {}, import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "find", {}>;
    findBySlug(slug: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(id: string, dto: UpdateJobDto): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/job.schema").Job, {}, {}> & import("./schemas/job.schema").Job & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
