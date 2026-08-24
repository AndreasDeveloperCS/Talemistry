import { BaseEntity } from "../../general/models/base-entity";

export class CompanyValue implements BaseEntity {
    _id?: any;
    value: string='';
    subgroups?: any[] = [];
    isVerified: boolean = false;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}