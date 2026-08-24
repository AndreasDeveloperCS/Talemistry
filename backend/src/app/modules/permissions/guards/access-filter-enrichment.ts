import { ExecutionContext } from "@nestjs/common";
import { writeInfoLog } from "../../log/services/log-service";
import { getImplementedInterfaces, INTERFACES } from "../../../decorators/interfaces.decorator";
import { isAdminVerification } from "../../base/services/reflector-helper.service";
import { Request } from 'express';
import { Role } from "../models/role";
import { getOwnerFilter, getPublicAccessFilter, getSharedEditFilter, getSharedReadFilter } from "./access-filters";
import { User } from "../../users/models/user";

export function enrichFilterPublic(context: ExecutionContext, entityModel: any, userRole: Role) {
    const message = `Enrich Filter Public`;
    try {
        const isVerifiableModel = getImplementedInterfaces(entityModel).includes(INTERFACES.Verifiable);
        if (isVerifiableModel && !isAdminVerification(userRole)) {
            context.switchToHttp().getRequest<Request>().publicAccessFilter = getPublicAccessFilter();
        }

        writeInfoLog(
            `${message}`, `${userRole.code}`,
            `entityModelName ${entityModel?.name}`,
            `${context.switchToHttp().getRequest<Request>().publicAccessFilter}`,
        );
        // STATIC FIELD OPTION with public static entityModel = OpenPosition;
        // const entityModelStatic = (controllerClass as any).entityModel;
        // const entityModelStaticName = entityModelStatic.name;
        // writeInfoLog(
        //     `entityModelStatic ${entityModelStatic}`,
        //     `entityModelName ${entityModelStaticName}`,
        // );
        //}
        ////console.log('public filter', context.switchToHttp().getRequest<Request>().publicAccessFilter);

    }
    catch (error) {
        //console.error(`PermissionGuard EntityModel - ${message} - Error: `, error);
        writeInfoLog(
            `PermissionGuard EntityModel - ${message} -  Error: `, error
        );
    }
}

export function enrichFilterOwner(context: ExecutionContext, entityModel: any, user: User, userRole: Role) {
    const message = `Enrich Filter Owner`;
    try {

        const model = getImplementedInterfaces(entityModel).includes(INTERFACES.OwnerModel);

        if (model && !isAdminVerification(userRole) && user) {
            context.switchToHttp().getRequest<Request>().ownerAccessFilter = getOwnerFilter(user._id);
        }

        writeInfoLog(
            `${message}`, `${userRole.code}`, `${user?.firstname} ${user?.lastname} (${user?.email})`,
            `entityModelName ${entityModel?.name}`,
            `${context.switchToHttp().getRequest<Request>().ownerAccessFilter}`,
        );
        //console.log('owner filter', context.switchToHttp().getRequest<Request>().ownerAccessFilter);
    }
    catch (error) {
        //console.error(`PermissionGuard EntityModel - ${message} - Error: `, error);
        writeInfoLog(
            `PermissionGuard EntityModel - ${message} -  Error: `, error
        );
    }
}

export function enrichFilterSharedRead(context: ExecutionContext, entityModel: any, user: User, userRole: Role) {
    const message = `Enrich Filter Shared Read`;
    try {
        const model = getImplementedInterfaces(entityModel).includes(INTERFACES.SharedReadModel);

        if (model && !isAdminVerification(userRole) && user) {
            context.switchToHttp().getRequest<Request>().sharedReadAccessFilter = getSharedReadFilter(user);
        }

        writeInfoLog(
            `${message} `, `${userRole.code} `, `${user?.firstname} ${user?.lastname} (${user?.email})`,
            `entityModelName ${entityModel?.name}`,
            `${context.switchToHttp().getRequest<Request>().sharedReadAccessFilter}`,
        );

        // STATIC FIELD OPTION with public static entityModel = OpenPosition;
        // const entityModelStatic = (controllerClass as any).entityModel;
        // const entityModelStaticName = entityModelStatic.name;
        // writeInfoLog(
        //     `entityModelStatic ${entityModelStatic}`,
        //     `entityModelName ${entityModelStaticName}`,
        // );
        // }
    }
    catch (error) {
        //console.error(`PermissionGuard EntityModel - ${message} - Error: `, error);
        writeInfoLog(
            `PermissionGuard EntityModel - ${message} -  Error: `, error
        );
    }
}

export function enrichFilterSharedEdit(context: ExecutionContext, entityModel: any, user: User, userRole: Role) {
    const message = `Enrich Filter Shared Edit`;
    try {
        const model = getImplementedInterfaces(entityModel).includes(INTERFACES.SharedEditModel);

        if (model && !isAdminVerification(userRole) && user) {
            context.switchToHttp().getRequest<Request>().sharedEditAccessFilter = getSharedEditFilter(user);
        }

        writeInfoLog(
            `${message}`, `${userRole.code}`, `${user?.firstname} ${user?.lastname} (${user?.email})`,
            `entityModelName ${entityModel?.name}`,
            `${context.switchToHttp().getRequest<Request>().sharedEditAccessFilter}`,
        );

        // STATIC FIELD OPTION with public static entityModel = OpenPosition;
        // const entityModelStatic = (controllerClass as any).entityModel;
        // const entityModelStaticName = entityModelStatic.name;
        // writeInfoLog(
        //     `entityModelStatic ${entityModelStatic}`,
        //     `entityModelName ${entityModelStaticName}`,
        // );
        // }
    }
    catch (error) {
        //console.error(`PermissionGuard EntityModel - ${message} - Error: `, error);
        writeInfoLog(
            `PermissionGuard EntityModel - ${message} -  Error: `, error
        );
    }
}