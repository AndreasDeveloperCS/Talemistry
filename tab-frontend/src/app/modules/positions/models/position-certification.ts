import { BaseEntity } from "../../general/models/base-entity";

export class PositionCertification implements BaseEntity {
    _id?: any;
    certification:string='';
    subgroups?:any[] = [];
    isVerified:boolean = false;
    dateTimeCreated:Date = new Date();
    dateTimeModified?:Date;
}