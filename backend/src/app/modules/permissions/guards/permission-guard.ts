import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from 'express';
import { Filtering, FilterRule } from "../../../helpers/filtering";
import { Pagination } from "../../../helpers/pagination";
import { Sorting } from "../../../helpers/sorting";
import { getRole, isAdminVerification } from "../../base/services/reflector-helper.service";
import { UtilitiesService } from "../../core/services/utilities.service";
import { writeErrorLog, writeInfoLog } from "../../log/services/log-service";
import { User } from "../../users/models/user";
import { AccessType, RestMethods } from "../models/access-type";
import { AccessTypesService } from "../services/access-types.service";
import { PermissionsService } from "../services/permissions.service";
import { RolesService } from "../services/roles.service";
import { enrichFilterOwner, enrichFilterPublic, enrichFilterSharedEdit, enrichFilterSharedRead } from "./access-filter-enrichment";
import { FunctionalBlocksService } from "../services/functional-blocks.service";
import { FunctionalBlock } from "../models/functional-block";
import { Role } from "../models/role";

function hasAccess(bitmask: number, accessValue: number): boolean {
    // console.log('hasAccess', (bitmask & accessValue), accessValue);
    // console.log('hasAccess', bitmask, accessValue);
    return (bitmask & accessValue) === accessValue;
};

@Injectable()
export class PermissionGuard implements CanActivate {

    // 1.  WE need allow access to the API based on next logic
    // 1.1 IF user is NOT authenticated we need allow access to API THAT IS PUBLIC FOR VIEW AND OR using FILTER IsVerfied for GET VIEW only (in case FUnctional BLock support this interface)
    // IF FUnctional Block does not implement interface IsVerified - ACCESS DENIED.

    // 1.2 IF user is authenticated it should have access to entities items based on next conditions:
    // 1.2.1. He is admin - FUll ACCESS
    // 1.2.2. He is owner of requested record
    // 1.2.3  
    // 1.3 

    constructor(private permissionService: PermissionsService,
        private accessTypeService: AccessTypesService,
        private functionalBlockService: FunctionalBlocksService,
        private roleService: RolesService,
        private readonly reflector: Reflector,
        private utilitiesService: UtilitiesService) {

    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            let isAccessAllowed = false;
            //console.log('PermissionGuard');
            const request = context.switchToHttp().getRequest<Request>();
            const response = context.switchToHttp().getResponse<Response>();

            const handler = context.getHandler();
            const type = context.getType();
            const method = request.method;
            const ip = request.ip || request.connection.remoteAddress;
            const endpointRoute = inferFunctionalBlock(request);

            if (endpointRoute === 'health-check') {
                writeInfoLog('Allowing public health-check request', { url: request.url, method, ip });
                return true;
            }

            //console.log('PermissionGuard', type, method, request.url, ip);
            const user: User = this.utilitiesService?.getUser(request);
            // Log video-chat related requests specifically for debugging
            if (request.url && request.url.includes('video-chat')) {
                console.log('[RTC🔍 GUARD] video-chat request', {
                    url: request.url,
                    method,
                    hasAuth: !!user,
                    userId: user?._id || '(none)',
                    email: user?.email || '(none)',
                    origin: request.headers?.origin,
                    authorization: request.headers?.authorization ? 'present' : 'absent',
                });
            }

            // If user is not authenticated (no Bearer token), check public endpoints
            // before attempting role resolution. This allows guest/token-based access to
            // public endpoints like video-chat-rooms.
            if (!user) {
                // --- PATCH: Make main background video endpoints public ---
                if (
                    request.url.startsWith('/api/presentation-content/video-promo-background') ||
                    request.url.startsWith('/api/presentation-content/video-promo-comp')
                ) {
                    console.log('[RTC🔍 GUARD] PATCH: Allowing unauthenticated access to background video endpoint', { url: request.url });
                    return true;
                }
                if (endpointRoute === 'talent-profile') {
                    return true;
                }
                let functionalBlock: FunctionalBlock | null = null;
                try {
                    functionalBlock = await this.functionalBlockService.getFunctionalBlockByRoute(endpointRoute);
                } catch { /* ignore */ }
                const isPublic: boolean = await this.checkIsPublic(endpointRoute, functionalBlock);
                if (isPublic) {
                    console.log('[RTC🔍 GUARD] unauthenticated but PUBLIC endpoint allowed', { url: request.url, endpointRoute });
                    writeInfoLog(`Endpoint ${endpointRoute} is public, allowing unauthenticated access`);
                    return true;
                }
                console.warn('[RTC🔍 GUARD] unauthenticated + NOT public => DENIED', { url: request.url, endpointRoute });
                writeErrorLog('Unauthenticated request to non-public endpoint', { url: request.url });
                return false;
            }

            const userRole = await getRole(this.roleService, user);

            //console.log('userRole', userRole);

            if (userRole == undefined) {
                writeErrorLog('UserRole has not been defined', user, userRole);
                throw new NotFoundException(`${user?.firstname ?? 'Unknown'} ${user?.lastname ?? 'User'} has incorrect role "${userRole}" `);
            }

            if (isAdminVerification(userRole)) {
                writeInfoLog('isAdminVerification user:', user);
                return true;
            }

            // check if endpoint is public and we need add flag for content or auth controllers and some others
            //console.log('endpointRoute', endpointRoute);

            let functionalBlock: FunctionalBlock | null = null;
            try {
                functionalBlock = await this.functionalBlockService.getFunctionalBlockByRoute(endpointRoute);
            } catch (dbError: any) {
                // Handle MongoDB connection errors gracefully
                if (dbError.name === 'MongoExpiredSessionError' ||
                    dbError.name === 'MongoPoolClosedError' ||
                    dbError.name === 'MongoNetworkError') {
                    console.error('MongoDB connection error in PermissionGuard, denying access:', dbError.message);
                    writeErrorLog('MongoDB connection error, denying access', dbError);
                    return false;
                }
                throw dbError;
            }
            //console.log('functionalBlock', functionalBlock);

            const isPublic: boolean = await this.checkIsPublic(endpointRoute, functionalBlock);

            if (isPublic) {
                writeInfoLog(`Endpoint ${endpointRoute} is public, allowing access for user:`, user);
                return true;
            }

            const accessTypes = await this.getAccessTypes();
            const bitmask = await this.permissionService.getBitmaskByRoute(userRole._id, endpointRoute);

            //console.log(`permission bitmask ${endpointRoute} ${functionalBlock}`, bitmask);

            var allowedAccessTypes = getAllowedAccessTypes(bitmask, accessTypes);
            if (allowedAccessTypes.length === 0) {
                isAccessAllowed = false;
            }

            const accessMethodMap = await this.buildAccessMethodMap(allowedAccessTypes);
            const includesMethod: boolean = accessMethodMap.includes(method as RestMethods);

            // writeInfoLog(
            //     `requesting endpointRoute: ${endpointRoute}`,
            //     `requesting handler: ${handler.name}`,
            //     `requesting REST method: ${method}`,
            //     `requesting includesMethod REST:`, includesMethod,
            //     `requesting type:${type}`,
            //     `requesting accessMethodMap:`, accessMethodMap.length,

            //     `requesting user: `, user,
            //     `requesting userRole: ${userRole}`,
            //     `requesting bitmask: ${bitmask}`,
            //     `requesting IP: ${ip}`,
            // );

            isAccessAllowed = includesMethod || hasAccessToRoute(userRole, endpointRoute, method);
            //console.log(`permission bitmask ${endpointRoute} ${functionalBlock}`, bitmask, 'isAccessAllowed', isAccessAllowed);

            try {
                const controllerClass = context.getClass();
                const entityModel = this.reflector.get('entityModel', controllerClass);
                //console.log(`permission bitmask ${endpointRoute} ${functionalBlock}`, bitmask, 'isAccessAllowed', entityModel, userRole, user, isAccessAllowed);

                enrichFilterPublic(context, entityModel, userRole);
                enrichFilterOwner(context, entityModel, user, userRole);
                enrichFilterSharedRead(context, entityModel, user, userRole);
                enrichFilterSharedEdit(context, entityModel, user, userRole);
            }
            catch (error: any) {
                // Handle MongoDB session errors gracefully
                if (error.name === 'MongoExpiredSessionError' ||
                    error.name === 'MongoPoolClosedError' ||
                    error.name === 'MongoNetworkError') {
                    console.error('MongoDB session/connection error in filter enrichment:', error.message);
                    writeErrorLog('MongoDB session error in filter enrichment, denying access', error);
                    return false;
                }

                console.error('PermissionGuard error', endpointRoute, error);
                const stackLine = error?.stack?.split('\n')[1]?.trim();
                writeErrorLog(`PermissionGuard error ${stackLine}`, error,);

                isAccessAllowed = false;
            }

            //console.log(`permission isAccessAllowed at the end ${endpointRoute} ${functionalBlock}`, bitmask, 'isAccessAllowed', isAccessAllowed);
            return isAccessAllowed;
        }
        catch (error: any) {
            // Handle MongoDB errors at top level
            if (error.name === 'MongoExpiredSessionError' ||
                error.name === 'MongoPoolClosedError' ||
                error.name === 'MongoNetworkError' ||
                error.name === 'MongoServerError') {
                console.error('MongoDB error in PermissionGuard:', error.name, error.message);
                writeErrorLog(`MongoDB error: ${error.name}`, error);
                return false;
            }

            console.error('PermissionGuard error', error);
            const stackLine = error?.stack?.split('\n')[1]?.trim();
            writeErrorLog(`PermissionGuard error ${stackLine}`, error,);

            return false;
        }
    }

    private async getPublicEndpoints(endpoint: string): Promise<string[]> {
        return ["user-credentials", "verification-requests", "companies-versions", "positions", "payments", "cvs", "auth", "companies-photo-gallery-public", "video-chat-rooms", "health-check"];
    }

    private async checkIsPublic(endpoint: string, functionalBlock: FunctionalBlock): Promise<boolean> {
        const publicEndpoints = await this.getPublicEndpoints(endpoint);
        return (functionalBlock != undefined && functionalBlock?.isPublic) || publicEndpoints.includes(endpoint);
    }
    private async getAccessTypes(): Promise<any[]> {
        const filtering: Filtering = [{ property: 'isActive', rule: FilterRule.EQUALS, value: true }];
        const sorting: Sorting = { property: 'registerNumber', direction: 'ASC' };
        const paginationParams: Pagination = { page: 0, limit: 100, size: 100, offset: 0 };
        const items = await this.accessTypeService.getAllAsync(paginationParams, sorting, filtering);
        return items?.items;
    }

    private async buildAccessMethodMap(accessTypes: AccessType[]): Promise<RestMethods[]> {
        const accessMethodsArray = accessTypes.flatMap((item) => {
            return item.methods
        });
        return Array.from(new Set(accessMethodsArray));
    }
}

function inferFunctionalBlock(request: Request): string {
    // request.url can be either:
    // - /api/<route>/...   (local/dev)
    // - /<route>/...       (when a reverse-proxy strips /api)
    // Normalize both so the first path segment is returned.
    const rawUrl = String(request?.url ?? '');
    const pathOnly = rawUrl.split('?')[0];
    const noLeadingSlashes = pathOnly.replace(/^\/+/, '');
    const withoutApiPrefix = noLeadingSlashes.startsWith('api/')
        ? noLeadingSlashes.slice('api/'.length)
        : noLeadingSlashes;

    return withoutApiPrefix.split('/')[0];
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
                    // Match either explicit sharedRead IDs or sharedRead emails
                    filters.push({ property: 'sharedReadIds', rule: FilterRule.IN, value: user._id });
                    filters.push({ property: 'sharedReadEmails', rule: FilterRule.IN, value: user.email });
                    // Also allow membership via participants array
                    filters.push({ property: 'participants.userId', rule: FilterRule.IN, value: user._id });
                    filters.push({ property: 'participants.email', rule: FilterRule.IN, value: user.email });
                    break;

                case 'SHAREDWRITE':
                    filters.push({ property: 'sharedEditIds', rule: FilterRule.IN, value: user._id });
                    filters.push({ property: 'sharedEditEmails', rule: FilterRule.IN, value: user.email });
                    filters.push({ property: 'participants.userId', rule: FilterRule.IN, value: user._id });
                    filters.push({ property: 'participants.email', rule: FilterRule.IN, value: user.email });
                    break;
            }
        }
    }

    // Step 5: Return compound filter
    return filters.length > 0 ? { $or: filters } : {};
}

export function getAllowedAccessTypes(bitmask: number, allAccessTypes: AccessType[]): AccessType[] {
    return allAccessTypes.filter(type => {
        return (bitmask & type.numberValue) !== 0;
    });
}


export function hasAccessToRoute(
    userRole: Role,
    endpointRoute: string,
    targetAccessType: string): boolean {
    //console.log('hasAccessToRoute', userRole.code, endpointRoute, targetAccessType);
    const hasAccess = getRoutesAccessMap()?.get(userRole.code)?.get(endpointRoute)?.includes(targetAccessType);
    //console.log('hasAccessToRoute', hasAccess);
    return hasAccess;
}

export function getRoutesAccessMap(): Map<string, Map<string, string[]>> {
    var map = new Map<string, Map<string, string[]>>();

    map.set('TALENT', new Map<string, string[]>());
    map.get('TALENT').set('companies', ['GET']);
    map.get('TALENT').set('skills', ['GET', 'POST']);
    map.get('TALENT').set('talent-position-feedback', ['GET']); // available for talent... positionID, stageID, feedback, status, recommendation
    // Needed by Text Chat to read contact notification channel preferences.
    map.get('TALENT').set('user-profiles', ['GET']);

    //map.get('TALENT').set('cover-letters', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    // map.get('TALENT').set('chat-rooms', ['GET', 'POST']);
    // map.get('TALENT').set('chat-messages', ['GET', 'POST']);

    map.set('RC', new Map<string, string[]>());
    map.get('RC').set('companies', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    map.get('RC').set('companies-positions', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    // Needed by Text Chat to read talent notification channel preferences.
    map.get('RC').set('user-profiles', ['GET']);

    // map.get('RC').set('position-pipelines', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // pipelineID positionID stages[]
    // map.get('RC').set('pipeline-stage', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // stageID pipelineID talents[]
    // map.get('RC').set('talent-pipeline-progress', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // talentProgressID stageID status, feedback, recommendation...

    // map.get('RC').set('chat-rooms', ['GET', 'POST']);
    // map.get('RC').set('chat-messages', ['GET', 'POST']);


    map.set('HR', new Map<string, string[]>());
    map.get('HR').set('companies', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    map.get('HR').set('companies-positions', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    // Needed by Text Chat to read talent notification channel preferences.
    map.get('HR').set('user-profiles', ['GET']);

    // map.get('HR').set('position-pipelines', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // pipelineID positionID stages[]
    // map.get('HR').set('pipeline-stage', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // stageID pipelineID talents[]
    // map.get('HR').set('talent-pipeline-progress', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

    map.get('HR').set('talent-position-feedback', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // available for talent... positionID, stageID, feedback, status, recommendation

    // map.get('HR').set('chat-rooms', ['GET', 'POST']);
    // map.get('HR').set('chat-messages', ['GET', 'POST']);

    map.set('HM', new Map<string, string[]>());
    map.get('HM').set('companies-verified', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // companyID
    // map.get('HM').set('companies-versions', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // companyID
    map.get('HM').set('companies-positions', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    // map.get('HM').set('position-workflow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);  // pipelineID positionID stages[]
    map.get('HM').set('pipelines', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);  // pipelineID positionID stages[]
    // map.get('HM').set('pipeline-stages', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);  // stageID pipelineID talents[]
    // map.get('HM').set('talent-pipeline-progress', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // talentProgressID stageID status, feedback, recommendation...
    map.get('HM').set('talent-position-feedback', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']); // available for talent... positionID, stageID, feedback, status, recommendation
    // Needed by Text Chat to read talent notification channel preferences.
    map.get('HM').set('user-profiles', ['GET']);

    // map.get('HM').set('chat-rooms', ['GET', 'POST']); // talentProgressID stageID status, feedback, recommendation...
    // map.get('HM').set('chat-messages', ['GET', 'POST']); // talentProgressID stageID status, feedback, recommendation...

    return map;
}
