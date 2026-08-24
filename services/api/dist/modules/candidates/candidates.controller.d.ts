import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, QueryCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
export declare class CandidatesController {
    private readonly service;
    constructor(service: CandidatesService);
    create(dto: CreateCandidateDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/candidate.schema").Candidate, {}, {}> & import("./schemas/candidate.schema").Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, import("./schemas/candidate.schema").Candidate, {}, {}> & import("./schemas/candidate.schema").Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(query: QueryCandidateDto): Promise<{
        items: (import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/candidate.schema").Candidate, {}, {}> & import("./schemas/candidate.schema").Candidate & {
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
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/candidate.schema").Candidate, {}, {}> & import("./schemas/candidate.schema").Candidate & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(id: string, dto: UpdateCandidateDto): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/candidate.schema").Candidate, {}, {}> & import("./schemas/candidate.schema").Candidate & {
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
