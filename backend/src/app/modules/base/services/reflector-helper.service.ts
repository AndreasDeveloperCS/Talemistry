import { ROLES } from "../../../common/enums";
import { UtilitiesService } from "../../core/services/utilities.service";
import { writeErrorLog } from "../../log/services/log-service";
import { Role } from "../../permissions/models/role";
import { RolesService } from "../../permissions/services/roles.service";
import { User } from "../../users/models/user";

export function isAdminVerification(userRole: Role) {
    writeErrorLog('isAdminVerification', userRole);
    return userRole.code == ROLES.SA || userRole.code == ROLES.ADMIN || userRole.code == ROLES.MODERATOR || userRole.code == ROLES.MD;
}

export async function getRole(roleService: RolesService, user: User): Promise<Role> {
    try {
        const userRoleCode: ROLES | string = user?.role[0] ?? ROLES.VISITOR;
        const userRole = await roleService.getRolesByCode(userRoleCode);
        return userRole;
    } catch (ex) {
        console.error(ex);
        writeErrorLog('getRole', user);
        return undefined;
    }
}

export async function getUserRoleFromRequest(roleService: RolesService, utilitiesService: UtilitiesService, request: Request): Promise<Role> {
    try {
        const user: User = utilitiesService.getUser(request);
        const userRole = await getRole(roleService, user);
        return userRole;
    } catch (ex) {
        console.error(ex);
        writeErrorLog('getUserRoleFromRequest', ex);
        return undefined;
    }

}

export async function isAdminByRequest(roleService: RolesService, utilitiesService: UtilitiesService, request: Request): Promise<boolean> {
    const userRole = await getUserRoleFromRequest(roleService, utilitiesService, request);
    return isAdminVerification(userRole);
}