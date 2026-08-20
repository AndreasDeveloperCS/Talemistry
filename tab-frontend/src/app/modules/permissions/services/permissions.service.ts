import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';
import { CRUDService } from '../../general/services/crud.service';
import { AccessType } from '../models/access-type';
import { FunctionalBlock } from '../models/functional-block';
import { Permission } from '../models/permission';
import { Role } from '../models/role';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })

export class PermissionsService extends CRUDService<Permission> {
    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.permissions}`;

    constructor(http: HttpClient) {
        super(http);
        //const superadminAccessToUsers = generateAccessCode(ROLES.SA, FUNCTIONALBLOCKS.UserManagement, ACCESSTYPES.WW);
        this.inheritedClassName = this.constructor.name;
    }

    getByRoleCodeIdAsync(roleCode: string, isProtected: boolean = true): Observable<Permission[]> {
        //this.requestSubscription?.unsubscribe();
        const tartgetUrl = `${this.tartgetUrl}/roleCode/${roleCode}`;

        const request = this.http.get<any>(tartgetUrl, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected
        });

        return request;
    }

    bulkUpdateAsync(savingPermissions: Permission[], roleID: any, isProtected: boolean, pushSubject: boolean) {
        const request = this.http.put<any>(`${this.tartgetUrl}/bulk/${roleID}`, savingPermissions, {
            headers: this.getHttpHeaders(isProtected),
            withCredentials: isProtected,
            observe: "body",
            reportProgress: true,
            responseType: "json",
        });
        // console.log('updateAsync pushSubject', pushSubject);

        if (pushSubject) {
            request.pipe(take(1)).subscribe((result: any) => {
                this.refreshDataBehaviorSubject.next(true);
                this.refreshData.next(true);
            });
        }
        return request;
    }

    generateAccessCode(role: Role, block: FunctionalBlock, access: AccessType): number {
        return (block.numberValue << 13) | (role.numberValue << 3) | access.numberValue;
    }

    hasAccess(permissionCode: number, role: Role, block: FunctionalBlock, access: AccessType,): boolean {
        const expectedCode = generateAccessCode(role, block, access);
        return (permissionCode & expectedCode) === expectedCode;
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this._onDestroy.next();
        this._onDestroy.complete();
    }
}

function generateAccessCode(role: Role, block: FunctionalBlock, access: AccessType): number {
    return (role.numberValue << 16) | (access.numberValue << 16) | block.numberValue;
}

function hasAccess(permissionCode: number, role: Role, block: FunctionalBlock, access: AccessType): boolean {
    const expectedCode = generateAccessCode(role, block, access);
    return (permissionCode & expectedCode) === expectedCode;
}