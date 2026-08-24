import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { catchError, map, Observable, of, Subject, tap, throwError } from 'rxjs';
import { ACCESSTYPE, AccessType } from '../../permissions/models/access-type';
import { FUNCTIONALBLOCK } from '../../permissions/models/functional-block-enum';
import { AccessTypesService } from '../../permissions/services/access-types.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { AuthService } from '../services/auth.service';
import { UserRolesService } from '../services/user-roles.service';
import { environment } from '../../../../environments/environment';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements OnDestroy {
  private refreshInProgress = false;
  private isLoggedIn = false;

  getEnabledAccessTypes(bitMask: number): AccessType[] {
    return this.auth.accessTypes.filter(type => (bitMask & type.numberValue) !== 0);
  }

  hasObjectAccess(functionalBlock: FUNCTIONALBLOCK, accessTypes: ACCESSTYPE[]): boolean {
    const permission = this.auth.permissionCodeMap.get(functionalBlock);
    const enabledAccessTypes = this.getEnabledAccessTypes(permission?.numberValue ?? 0);

    const isAvailable = enabledAccessTypes.some(type => type.code === ACCESSTYPE.ADMIN
      || type.code === ACCESSTYPE.OWNER);

    return isAvailable;
  }

  hasAccess(functionalBlock: FUNCTIONALBLOCK, accessTypes: ACCESSTYPE[]): boolean {
    const permission = this.auth.permissionCodeMap.get(functionalBlock);
    const enabledAccessTypes = this.getEnabledAccessTypes(permission?.numberValue ?? 0);

    const isAvailable = enabledAccessTypes.some(type => type.code === ACCESSTYPE.ADMIN
      || type.code === ACCESSTYPE.OWNER);

    return isAvailable;
  }
  isAvailable(functionalBlock: FUNCTIONALBLOCK): boolean {
    const permission = this.auth.permissionCodeMap.get(functionalBlock);
    const enabledAccessTypes = this.getEnabledAccessTypes(permission?.numberValue ?? 0);

    const isAvailable = enabledAccessTypes.some(type => type.code === ACCESSTYPE.ADMIN
      || type.code === ACCESSTYPE.OWNER);

    return isAvailable;
  }

  protected _onDestroy = new Subject<void>();
  private _userRoles: string[] = [];
  public get userRoles(): string[] {
    if (this._userRoles.length === 0 && sessionStorage.getItem(`${environment.storage.userId}`)) {
      //this.userRolesService.getUsersRoleAsync();
    }
    return this._userRoles;
  }

  public set userRoles(value: string[]) {
    this._userRoles = value;
  }

  hasFullAccess(functionalBlock: any): boolean {
    return this.isAuthorized(functionalBlock, [ACCESSTYPE.ADMIN]);
  }

  canEditItem<T>(functionalBlock: any, entity: any = undefined): boolean {
    const isAdmin = this.isAuthorized(functionalBlock, [ACCESSTYPE.ADMIN]);
    if (isAdmin) {
      return isAdmin;
    }
    if (entity && entity.hasOwnProperty('userId')) {
      const ownerID = entity["userId"];
      const token = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`);
      const user: User = token && this.getDecodedToken(token).user;
      const isOwner = this.isAuthorized(functionalBlock, [ACCESSTYPE.OWNER])
        && (ownerID == user._id);
      if (isOwner) {
        return isOwner;
      }
    }

    if (entity && entity.hasOwnProperty('sharedEditIds')) {
      const sharedEditIds = entity["sharedEditIds"];
      const token = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`);
      const user: User = token && this.getDecodedToken(token).user;
      const isSharedEdit = this.isAuthorized(functionalBlock, [ACCESSTYPE.OWNER])
        && (sharedEditIds?.includes(user._id));
      if (isSharedEdit) {
        return isSharedEdit;
      }
    }
    if (entity && entity.hasOwnProperty('sharedEditEmails')) {
      const sharedEditEmails = entity["sharedEditEmails"];
      const token = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`);
      const user: User = token && this.getDecodedToken(token).user;
      const sharedEdit = this.isAuthorized(functionalBlock, [ACCESSTYPE.OWNER]) && (sharedEditEmails?.includes(user.email));
      if (sharedEdit) {
        return sharedEdit;
      }
    }
    return false;
  }

  canViewShared(functionalBlock: any): boolean {
    return this.isAuthorized(functionalBlock, [ACCESSTYPE.SHARED_READ]);
  }

  isItemOwner(functionalBlock: any): boolean {
    return this.isAuthorized(functionalBlock, [ACCESSTYPE.OWNER]);
  }

  hasPublicViewCollection(functionalBlock: any): boolean {
    return this.isAuthorized(functionalBlock, [ACCESSTYPE.PUBLIC_NOT_AUTHORISED]);
  }

  canCreateItems(functionalBlock: any): boolean {
    return this.isAuthorized(functionalBlock, [ACCESSTYPE.INFO_POPULATION]);
  }

  private isAuthorized(functionalBlock: any, accessTypes: ACCESSTYPE[]): boolean {
    const permission: number = this.auth.permissionCodeMap.get(functionalBlock)?.numberValue ?? 0;

    const isAllowed = this.auth.accessTypes.some((type: AccessType) => {
      const isAllowedFlag = accessTypes.includes(type.code as ACCESSTYPE) && (permission & type.numberValue) === type.numberValue;
      return isAllowedFlag;
    });

    return isAllowed;
  }

  constructor(
    private router: Router,
    private accessTypesService: AccessTypesService,
    private permissionService: PermissionsService,
    private auth: AuthService,
    private http: HttpClient,
    private userRolesService: UserRolesService) {

    this.auth.rolesSubject.subscribe((roles: any) => {
      console.log('roles', roles);
      this.userRoles = roles;
    });
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    const userId = sessionStorage.getItem(environment.storage.userId);
    const idToken = userId
      ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`)
      : null;

    if (!idToken) {
      this.router.navigate([environment.routes.auth.login], { queryParams: { returnUrl: _state.url } });
      return of(false);
    }

    try {
      const expiresAt = JSON.parse(window.atob(idToken.split('.')[1])).exp * 1000;

      if (Date.now() < expiresAt) {
        console.log('Token is still valid');
        return of(true);
      }

      // 🔥 HERE we call and RETURN the observable
      console.log('TOKEN HAS EXPIRED, REFRESH TOKEN IS NEEDED');
      return this.refreshToken().pipe(
        map((refreshedUserData: any) => {
          console.log('Refresh success, continuing navigation');
          if (refreshedUserData?.accessToken) {
            this.isLoggedIn = true;
            return true;
          }
          this.isLoggedIn = false;
          this.router.navigate([environment.routes.auth.login], { queryParams: { returnUrl: _state.url } });
          return false;
        }),
        catchError(err => {
          console.error('Refresh failed', err);
          this.router.navigate([environment.routes.auth.login], { queryParams: { returnUrl: _state.url } });
          return of(false);
        })
      );

    } catch (e) {
      console.error('Token parse error', e);
      this.router.navigate([environment.routes.auth.login], { queryParams: { returnUrl: _state.url } });
      return of(false);
    }
  }

  getAccessToken(): string | null {
    const userId = sessionStorage.getItem(environment.storage.userId);
    return userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`) : null;
  }

  getRefreshToken(): string | null {
    const userId = sessionStorage.getItem(environment.storage.userId);
    return userId ? sessionStorage.getItem(`${environment.storage.prefixToken}${userId}_refresh`) : null;
  }

  refreshToken(): Observable<any> {
    console.log('refreshInProgress?', this.refreshInProgress);
    if (this.refreshInProgress) {
      console.log('Skipping refresh because another one is in progress');
      return of(null);
    }
    this.refreshInProgress = true;

    const userId = sessionStorage.getItem(environment.storage.userId);
    const refreshToken = this.getRefreshToken();

    console.log('Trying to refresh the expired token...');

    const targetUrl = `${environment.apiUrl}${environment.serverPaths.refresh}`;
    const body = { id: userId, refreshToken: refreshToken };

    return this.http.post(targetUrl, body).pipe(
      tap((refreshedUserData: any) => {
        console.log('Tokens after refresh', refreshedUserData);
        if (refreshedUserData?.accessToken) {
          sessionStorage.setItem(`${environment.storage.prefixToken}${userId}`, refreshedUserData.accessToken);
          sessionStorage.setItem(`${environment.storage.prefixToken}${userId}_refresh`, refreshedUserData.refreshToken);
          this.isLoggedIn = true;
          this.auth.loginSubject.next(refreshedUserData);
          this.auth.populateUserPermissions(refreshedUserData.id, refreshedUserData.accessToken);
        }
      }),
      catchError(err => {
        console.error('Token refresh failed', err);
        this.router.navigate([environment.routes.auth.login]);
        return throwError(() => err);
      }),
      tap(() => (this.refreshInProgress = false))
    );
  }

  getDecodedToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
