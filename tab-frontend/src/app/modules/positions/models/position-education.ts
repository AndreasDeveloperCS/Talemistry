import { BaseEntity } from "../../general/models/base-entity";

export class PositionEducation implements BaseEntity {
    _id?: any;
    education:string='';
    subgroups?:any[] = [];
    isVerified:boolean = false;
    dateTimeCreated:Date = new Date();
    dateTimeModified?:Date;
}