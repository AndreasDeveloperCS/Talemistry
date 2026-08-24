import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AccessType } from "../../permissions/models/access-type";
import { ACCESS_KEY, BLOCK_KEY } from "./access.decorator";
import { PermissionsService } from "../../permissions/services/permissions.service";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AccessGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionsService: PermissionsService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const accessType: AccessType = this.reflector.get(ACCESS_KEY, context.getHandler());
        const block: string = this.reflector.get(BLOCK_KEY, context.getHandler());

        // const userPermissions = await this.permissionsService.getBitmask(user.role, block);

        // // Attach access-based filters for controller to use later
        // if ((accessType & AccessType.READ_ALL) && (userPermissions & AccessType.READ_ALL)) {
        //     request.accessFilter = {};
        //     return true;
        // }

        const filters: any[] = [];

        // if (userPermissions & AccessType.READ_VERIFIED) filters.push({ isVerified: true });
        // if (userPermissions & AccessType.READ_OWNER) filters.push({ createdBy: user._id });
        // if (userPermissions & AccessType.READ_SHARED) filters.push({ sharedWith: user.email });

        if (filters.length === 0) {
            return false;
        }
        request.accessFilter = { $or: filters };
        return true;
    }
}