import { Controller, HttpException, HttpStatus, Injectable, OnModuleInit, Type } from "@nestjs/common";
import { ObjectId } from "bson";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Filtering, FilterRule } from "../../../helpers/filtering";
import { Pagination } from "../../../helpers/pagination";
import { Sorting } from "../../../helpers/sorting";
import { IAuditCreated, IBaseModel } from "../models/base";
import { IBaseService } from "../services/base.service";
import { User } from "../../users/models/user";
import { UtilitiesService } from "../../core/services/utilities.service";
import { ModuleRef } from "@nestjs/core";
import { AccessTypesService } from "../../permissions/services/access-types.service";
import { RolesService } from "../../permissions/services/roles.service";
import { PermissionsService } from "../../permissions/services/permissions.service";
import { AccessType } from "../../permissions/models/access-type";

@Controller('base')
@Injectable()
export abstract class BaseController<T extends IBaseModel,> implements OnModuleInit {

    className = this.constructor.name;
    public static entityModel: any;

    protected utilitiesService: UtilitiesService;
    protected permissionService: PermissionsService;
    protected accessTypeService: AccessTypesService;
    protected roleService: RolesService;

    constructor(protected service: IBaseService<T>,
        protected moduleRef: ModuleRef) {
        this.onModuleInit();
    }

    async onModuleInit() {
        if (this.moduleRef) {
            this.utilitiesService = await this.moduleRef.get(UtilitiesService, { strict: false });
            this.accessTypeService = await this.moduleRef.get(AccessTypesService, { strict: false });
            this.permissionService = await this.moduleRef.get(PermissionsService, { strict: false });
            this.roleService = await this.moduleRef.get(RolesService, { strict: false });
            console.log(`[BaseController] Loaded onModuleInit for ${this.className} ${this.utilitiesService?.className}`);
        }
    }
    checkIsOwner() {

    }

    filterVerification() {

    }

    isAuthorized(request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>, id: string = '') {
        //console.log(`${this.className}`, 'isAuthorized utilitiesServiceBase', this.utilitiesService);
        const requestingUser: User = this.utilitiesService?.getUser(request);
        //console.log(`${this.className}`, 'isAuthorized', requestingUser);

        // TODO: Check if the user has admin permissions or has the right role
        //const isAdmin = requestingUser.role.some(role => role.toUpperCase() == ROLES.SA.toUpperCase());

        if (new ObjectId(id) != requestingUser._id && new ObjectId(id) != requestingUser.userId) {
            return response.status(403).json({ message: `User is not authorized to request or change this data` });
        }
    }

    getEntity(): Promise<Type<T>> {
        return Promise.resolve(BaseController.entityModel);
    }

    getAccessFilters(request: Request): Filtering {
        const accessConditions: Filtering = [];
        //console.log('getAccessFilters 1', request.publicAccessFilter, request.ownerAccessFilter);
        //console.log('getAccessFilters 2', request['publicAccessFilter']);

        if (request.publicAccessFilter) {
            accessConditions.push(...request.publicAccessFilter);
        }
        if (request.ownerAccessFilter) {
            accessConditions.push(...request.ownerAccessFilter);
        }
        if (request.sharedReadAccessFilter) {
            accessConditions.push(...request.sharedReadAccessFilter);
        }
        if (request.sharedEditAccessFilter) {
            accessConditions.push(...request.sharedEditAccessFilter);
        }
        return accessConditions;
    }

    async getAllAsync(
        paginationParams: Pagination,
        sortParams: string,
        filterParams: string,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>,
        ip: any
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const accessFilter = this.getAccessFilters(request);

            //console.log('getAllAsync publicAccessFilter', accessFilter, paginationParams, sortParams, filterParams);

            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            // console.log('getAllAsync 2', accessFilter, paginationParams,
            //     sortParams, filterParams);

            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                accessFilter
            );

            //console.log('Received Data', paginationResult);

            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    async getByIdAsync(
        _id: string,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>,
        ip: any
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const accessFilter = this.getAccessFilters(request);
            const result = await this.service.getByIdAsync(_id, accessFilter);
            console.log('Received Data getById', result);
            response.status(200).json(result);
            return result;
        } catch (error) {
            const isHttpException = error instanceof HttpException;
            const status = isHttpException
                ? error.getStatus()
                : Number(error?.status ?? error?.statusCode) || HttpStatus.INTERNAL_SERVER_ERROR;

            if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                console.error(error);
            }

            const payload = isHttpException
                ? error.getResponse()
                : error?.response ?? error;

            return response.status(status).send(payload);
        }
    }

    async postAsync(
        entity: T,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>,
        ip: any
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const result = await this.service.createAsync(entity);
            console.log("Post Async result", result);
            return response.status(200).send(result);
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    async putAsync(
        body: any,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>,
        ip: any
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('putAsync', body);
        try {
            const info: T = body;
            const result = await this.service.updateAsync(info);
            //console.log('Base Controller putAsync', info, 'result', result);
            return response.status(204).send(result);
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    async patchAsync(
        _id: string,
        propertyName: string,
        body: string,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const keyValue = JSON.parse(JSON.stringify(body));
            const property = Object.keys(keyValue)[0];
            const value = Object.values(keyValue)[0];
            const id = new ObjectId(_id);
            const result = await this.service.patchAsync(_id, property, value);

            return response.status(200).send(result);
        } catch (error) {
            console.error(`Could not patch ${propertyName}: ${error}`);
            console.error(error);
            return response.status(500).send(error);
        }
    }

    async deleteAsync(
        id: string,
        request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
        response: Response<any, Record<string, any>>
    ) {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('delete entity with id', id);

        const idObj = typeof id === 'string' ? new ObjectId(id) : id;
        try {
            const result: T = await this.service.deleteAsync(idObj);
            return response.status(200).send(result);
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }
}


function buildPublicAccessFilter(role: string): any {
    const filters: Filtering = [];

    if (role === 'VISITOR' && filters.length === 0) {
        filters.push({
            property: 'isVerified',
            rule: FilterRule.EQUALS,
            value: true
        });
        return filters
    }
}

function buildAccessFilter(bitmask: number, user: User, accessTypesList: AccessType[]): any {
    const filters: Filtering = [];

    for (const accessType of accessTypesList) {

        if ((bitmask & (1 << accessType.numberValue)) !== 0 && accessType) {
            const accessCode = accessType.code;

            switch (accessCode) {
                case 'PUBLIC':

                    filters.push({
                        property: 'isVerified',
                        rule: FilterRule.EQUALS,
                        value: true
                    });
                    break;

                case 'OWNER':

                    filters.push({
                        property: 'createdBy',
                        rule: FilterRule.EQUALS,
                        value: user._id
                    });
                    filters.push({
                        property: 'userId',
                        rule: FilterRule.EQUALS,
                        value: user._id
                    });
                    break;

                case 'SHAREDREAD':
                    filters.push({
                        property: 'sharedRead',
                        rule: FilterRule.LIKE,
                        value: user?.email
                    });
                    break;

                case 'SHAREDWRITE':
                    filters.push({
                        property: 'sharedEdit',
                        rule: FilterRule.LIKE,
                        value: user?.email
                    });
                    break;
            }
        }
    }

    // Step 5: Return compound filter
    return filters.length > 0 ? { $or: filters } : {};
}

