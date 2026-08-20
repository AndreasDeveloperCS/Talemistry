import { BaseEntity } from "../../general/models/base-entity";

export class Country implements BaseEntity{
    _id?: any;
    name:string = '';
    code:string = '';
    
    createdDate: Date = new Date();
    modifiedDate?: Date;
}