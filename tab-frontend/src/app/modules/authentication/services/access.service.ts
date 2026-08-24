import { Injectable } from '@angular/core';
import { AccessType } from '../../permissions/models/access-type';
import { Permission } from '../../permissions/models/permission';

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private userPermissionCode: number = 0;  // This will be set dynamically

  constructor() { }

  async hasAccessAsync(rolesCode: string[], functionalBlockCode: string, accessTypeBit: number): Promise<boolean> {
    //const permissions = await this.permissionsService.getBitmask(rolesCode[0], functionalBlockCode); // Returns integer bitmask
    const permissions = 0; // Replace with actual permissions retrieval logic
    return (permissions & accessTypeBit) !== 0;
  }
  // Set the current user's permission code (retrieved from backend)
  setUserPermission(code: number): void {
    this.userPermissionCode = code;
  }

  // Check if the user has access to a specific role, access type, and functional block
  hasAccess(permission: Permission | undefined, accessTypesCodes: AccessType[]): boolean {
    const hasAccess = permission ? accessTypesCodes.some(access => this.checkAccessCode(access, permission)) : false;
    return hasAccess;
  }

  // Generate the access code using the predefined bitwise shifts
  private checkAccessCode(access: AccessType, permission: Permission): number {
    return (permission.numberValue << access.numberValue);
    //// | (block << 20)  | access;
  }
}