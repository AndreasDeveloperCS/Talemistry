import { HydratedDocument, Types } from 'mongoose';
export type OfferDocument = HydratedDocument<Offer>;
export declare enum OfferStatus {
    Drafting = "drafting",
    PendingApproval = "pending-approval",
    Approved = "approved",
    Sent = "sent",
    Accepted = "accepted",
    Declined = "declined",
    Withdrawn = "withdrawn"
}
export declare class ApprovalStep {
    approver: string;
    role: string;
    decision: string;
    decidedAt: Date;
}
export declare class Offer {
    candidateId: Types.ObjectId;
    jobId: Types.ObjectId;
    status: OfferStatus;
    baseSalary: number;
    bonus: number;
    equity: number;
    currency: string;
    startDate: Date;
    approvals: ApprovalStep[];
    acceptanceLikelihood: number;
    expiresAt: Date;
}
export declare const OfferSchema: import("mongoose").Schema<Offer, import("mongoose").Model<Offer, any, any, any, import("mongoose").Document<unknown, any, Offer, any, {}> & Offer & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Offer, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Offer>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Offer> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
