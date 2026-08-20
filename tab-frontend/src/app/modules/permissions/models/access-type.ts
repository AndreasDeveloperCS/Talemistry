import { BaseEntity } from "../../general/models/base-entity";

export enum RestMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export enum ACCESSTYPE {
    PUBLIC_NOT_AUTHORISED = "PUBLIC_NOT_AUTHORISED",
    INFO_POPULATION = "INFO_POPULATION",
    OWNER = "OWNER",
    SHARED_READ = "SHARED_READ",
    SHARED_EDIT = "SHARED_EDIT",
    ADMIN = "ADMIN",
}

export class AccessType implements BaseEntity {
    _id: any;
    code: string = '';
    description: string = '';
    methods: RestMethods[] = [];
    isActive: boolean = true;

    bit: number = 0;
    registerValue: number = 0;
    bitValue: number = 0;
    numberValue: number = 0;

    createdBy?: any;
    modifiedBy?: any;
    createdDate: Date = new Date();
    modifiedDate: Date = new Date();
}
