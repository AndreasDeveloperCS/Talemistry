import { BaseEntity } from "../../general/models/base-entity";

export class PositionBenefit implements BaseEntity {
    _id?: any;
    benefit:string='';
    subgroups?:any[] = [];
    isVerified:boolean = false;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}
  