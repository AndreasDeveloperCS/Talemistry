import { OffersService } from './offers.service';
import { Offer, OfferStatus } from './schemas/offer.schema';
export declare class OffersController {
    private readonly service;
    constructor(service: OffersService);
    create(dto: Partial<Offer>): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    findAll(status?: OfferStatus): import("mongoose").Query<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[], import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, {}, {}> & import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>, {}, import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "find", {}>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    transition(id: string, status: OfferStatus): Promise<import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    approve(id: string, approver: string): Promise<import("mongoose").Document<unknown, {}, Offer, {}, {}> & Offer & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
}
