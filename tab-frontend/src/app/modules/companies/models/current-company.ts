import { BaseEntity } from "../../general/models/base-entity";

export class CurrentCompany implements BaseEntity {
    _id?: any;
    userId: any;
    companyId: any;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}