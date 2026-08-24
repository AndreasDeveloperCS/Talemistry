import { Model } from 'mongoose';
import { Interview, InterviewDocument, InterviewStatus } from './schemas/interview.schema';
export declare class InterviewsService {
    private readonly model;
    constructor(model: Model<InterviewDocument>);
    create(dto: Partial<Interview>): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(status?: InterviewStatus): import("mongoose").Query<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[], import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>, {}, import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "find", {}>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(id: string, dto: Partial<Interview>): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    submitScorecard(id: string, scorecard: Interview['scorecard'], recommendation: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Interview, {}, {}> & Interview & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
