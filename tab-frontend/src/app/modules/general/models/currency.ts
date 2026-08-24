import { BaseEntity } from "../../general/models/base-entity";

export class Currency implements BaseEntity {
    _id?: any;

    name: string = '';
    symbol: string = '';
    symbolNative: string = '';
    decimalDigits: number = 0;
    rounding: number = 0;
    code: string = '';
    namePlural: string = '';
    createdBy?: any;
}