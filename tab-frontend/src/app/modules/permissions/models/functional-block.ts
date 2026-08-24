import { BaseEntity } from "../../general/models/base-entity";

export class FunctionalBlock implements BaseEntity {
    _id: any;

    code: string = '';
    description: string = '';

    endpointRoute: string = '';
    isActive: boolean = true; // ?

    registerValue: number = 0;
    bitValue: BigInt = BigInt(0); // or use string if BigInt is not supported
    numberValue: number = 0;

    createdBy?: any;
    modifiedBy?: any;
    createdDate: Date = new Date();
    modifiedDate: Date = new Date();
}