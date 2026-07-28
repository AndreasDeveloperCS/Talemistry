import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from './schemas/candidate.schema';
import { CreateCandidateDto, QueryCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { JourneyStage } from '../../common/journey';
export declare class CandidatesService {
    private readonly model;
    constructor(model: Model<CandidateDocument>);
    create(dto: CreateCandidateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(query: QueryCandidateDto): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(id: string, dto: UpdateCandidateDto): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    moveToStage(id: string, stage: JourneyStage): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Candidate, {}, {}> & Candidate & {
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
