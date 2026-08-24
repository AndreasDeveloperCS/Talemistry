import { BaseEntity } from "../../general/models/base-entity";

export class University implements BaseEntity{
    _id?: any;
    name: string = '';
    country: string ='';
    domains: string[] = [];
    web_pages: string[] = [];
    alpha_two_code: string[] = [];
    stateProvince: string = '';
    isVerified:boolean = false;
    createdDate: Date = new Date();
    modifiedDate?: Date;
}