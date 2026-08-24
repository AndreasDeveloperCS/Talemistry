import { BaseEntity } from "../../general/models/base-entity";
import { FUNCTIONALBLOCK } from "./functional-block-enum";

export class Permission implements BaseEntity {
    _id?: any;
    roleId: any;
    roleCode: string = '';
    functionalBlockId: any;
    functionalBlockCode!: FUNCTIONALBLOCK;
    bitValue: number = 0;
    numberValue: number = 0;

    isActive: boolean = true;

    createdBy?: any;
    modifiedBy?: any;
    createdDate?: Date = new Date();
    modifiedDate?: Date = new Date();
}