import { BaseEntity } from "../../general/models/base-entity";

export class PositionLiked implements BaseEntity {
    _id?: any;
    userId: any;
    positionsLiked?:any[] = [];
    isVerified:boolean = false;
    createdBy: any;
    createdDate: Date = new Date();
    modifiedBy: any;
    modifiedDate?: Date;
}