import { BaseEntity } from "../../general/models/base-entity";

export class Role implements BaseEntity {
    _id: any;

    code: string = '';
    description: string = '';
    
    route: string = '';
    isActive: boolean = true; // ?

    registerValue: number = 0;
    bitValue: number = 0;
    numberValue: number = 0;

    createdBy?: any;
    modifiedBy?: any;
    createdDate: Date = new Date();
    modifiedDate: Date = new Date();
}