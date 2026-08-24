import 'reflect-metadata';

const IMPLEMENTED_INTERFACES_KEY = Symbol('implemented_interfaces');

export function Implements(...interfaces: string[]) {
    return function (target: any) {
        Reflect.defineMetadata(IMPLEMENTED_INTERFACES_KEY, interfaces, target);
    };
}

export function getImplementedInterfaces(target: any): string[] {
    return Reflect.getMetadata(IMPLEMENTED_INTERFACES_KEY, target) || [];
}

export enum INTERFACES {
    BaseModel = 'IBaseModel',
    Verifiable = 'IVerifiableModel',

    EntityAudit = 'IEntityAudit',
    AuditCreated = 'IAuditCreated',
    AuditModified = 'IAuditModified',

    OwnerModel = 'IOwnerModel',

    SharedModel = 'ISharedModel',
    SharedReadModel = 'ISharedReadModel',
    SharedEditModel = 'ISharedEditModel',
    SharedIdsReadModel = 'ISharedIdsReadModel',
    SharedIdsEditModel = 'ISharedIdsEditModel',
    SharedEmailsReadModel = 'ISharedEmailsReadModel',
    SharedEmailsEditModel = 'ISharedEmailsEditModel',

    CustomPosition = 'ICustomPosition'
}
