import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription, take, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { NotificationWindowComponent } from '../../general/dialogs/notification-window/notification-window.component';
import { DialogHelperService } from '../../general/services/dialog-helper.service';
import { ROLES } from '../models/roles';
import { SignInData, SignUpData } from '../models/signin-signup-info';
import { UserData } from '../models/user-data';
import { Permission } from '../../permissions/models/permission';
import { AccessType } from '../../permissions/models/access-type';
import { AccessTypesService } from '../../permissions/services/access-types.service';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { WarningsErrorsDialogComponent } from '../../general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })

export class AuthService implements OnDestroy {
  private _permissionCodeMap: Map<string, Permission> = new Map<string, Permission>();
  public get permissionCodeMap(): Map<string, Permission> {
    return this._permissionCodeMap;
  }
  public set permissionCodeMap(value: Map<string, Permission>) {
    this._permissionCodeMap = value;
  }
  accessTypes: AccessType[] = [];


  rolesSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  loginSubject: BehaviorSubject<UserData> = new BehaviorSubject<UserData>({ id: '', token: '', refreshToken: '' });
  notificationMessageSubject: Subject<string> = new Subject<string>();
  _isLoggedIn: boolean = false;
  private loginStatusSubject = new BehaviorSubject<boolean>(false);
  loginStatus$ = this.loginStatusSubject.asObservable();

  private _permissionsReady = new BehaviorSubject<boolean>(false);
  public permissionsReady$ = this._permissionsReady.asObservable();

  private _accessTypesReady = new BehaviorSubject<boolean>(false);
  public accessTypesReady$ = this._accessTypesReady.asObservable();

  public redirectUrl: string | null | undefined;
  public subscriptionLogin?: Subscription;
  public loginRequest?: Observable<Object> | undefined;
  public registrationRequest?: Observable<Object> | undefined;

  protected _onDestroy = new Subject<void>();
  constructor(
    private accessTypesService: AccessTypesService,
    private permissionService: PermissionsService,
    public dialog: MatDialog,
    private http: HttpClient,
    public dialogHelper: DialogHelperService,
    private router: Router
  ) { }

  getAccessTypes() {
    this.accessTypesService?.getAllAccessTypesAsync(true)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((at: any) => {
        //console.log('getAllAccessTypesAsync', at);
        this.accessTypes = at;
        this._accessTypesReady.next(true);
      });
  }

  getPermissionsByRole(role: string) {
    this.permissionService.getByRoleCodeIdAsync(role, true)
      .pipe(takeUntil(this._onDestroy))
      .subscribe((permissions: Permission[]) => {
        console.log('getPermissionsByRole', permissions);
        if (this.permissionCodeMap.size > 0) {
          this.permissionCodeMap.clear();
        }
        permissions.forEach(permission => {
          //console.log(permission.functionalBlockCode);
          this.permissionCodeMap.set(permission.functionalBlockCode, permission);
        });
        this._permissionsReady.next(true);
      });
  }

  setLoginStatus(status: boolean) {
    this.loginStatusSubject.next(status);
  }

  recover(recoveryData: any): Observable<any> | undefined {
    const tartgetUrl = `${environment.apiUrl}${environment.serverPaths.recover}`;
    return this.http.post(tartgetUrl, recoveryData);
  }

  isAuthenticated() {
    return sessionStorage.getItem(`${environment.storage.userId}`) != undefined
      && sessionStorage.getItem(`${environment.storage.token}`) != undefined;
  }

  getCurrentUser(): User | null {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);

    if (!idToken) {
      return null;
    }

    try {
      return this.decodeJWTToken(idToken).user;
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }

  getCurrentRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role[0] || null;
  }

  hasRole(roles: string[]): boolean {
    const currentRole = this.getCurrentRole();
    console.log('Current role', currentRole);
    return !!currentRole && roles.includes(currentRole);
  }

  login(signInData: SignInData): Observable<any> | undefined {

    const body = signInData;

    const tartgetUrl = `${environment.apiUrl}${environment.serverPaths.login}`;

    try {
      this.loginRequest = this.http.post(tartgetUrl, body, {
        withCredentials: false
      });

      this.loginRequest
        .pipe(takeUntil(this._onDestroy))
        .subscribe((sessionTokenResult: any) => {

          const userData: UserData = sessionTokenResult;
          console.log('userData', userData);
          this.handleLogin(userData);
          return userData;
        },
          (err) => {
            console.error(err);
          });
    } catch (ex) {
      console.error('login', ex);
    }

    return this.loginRequest;
  }

  decodeJWTToken(token: any): any {
    if (!token) {
      //console.log('Token split', token);
      return null;
    }
    try {
      //console.log('Token split', token.split('.')[1]);
      const parse = atob(token.split('.')[1]);
      //console.log('Token parse', parse);
      return JSON.parse(parse);
    } catch (e) {
      console.error('Token decode error:', e);
      return null;
    }
  }

  getRoles() {

    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) {
      return null;
    }
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
    if (!idToken) {
      return null;
    }
    const decodedToken = this.decodeJWTToken(idToken);
    console.log('decodedToken', decodedToken);
    return decodedToken.user.role;
  }

  handleLogin(userData: UserData) {
    if (!userData) {
      return;
    }
    console.log('handleLogin', userData);

    if (userData.id && userData.token && userData.refreshToken) {
      this._isLoggedIn = true;
      sessionStorage.setItem(`${environment.storage.userId}`, userData.id);
      sessionStorage.setItem(`${environment.storage.prefixToken}${userData.id}`, userData.token);
      sessionStorage.setItem(`${environment.storage.prefixToken}${userData.id}_refresh`, userData.refreshToken);
    }

    console.log('sessionStorage.getItem',
      sessionStorage.getItem(`${environment.storage.userId}`),
      sessionStorage.getItem(`${environment.storage.prefixToken}${userData.id}`),
      sessionStorage.getItem(`${environment.storage.prefixToken}${userData.id}_refresh`)
    );

    console.log('Token Info', this.decodeJWTToken(userData.token));
    console.log('Refresh Token Info', this.decodeJWTToken(userData.refreshToken));

    this.loginSubject.next(userData);
    this.loginStatusSubject.next(true);
    this.populateUserPermissions(userData.id, userData.token);
  }

  refreshUserPermissions() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    const token = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
    const refreshToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}_refresh`);
    if (userId && token && refreshToken) {
      this.populateUserPermissions(userId, token);
    }
  }

  populateUserPermissions(userId: string, token: string) {
    const decodedToken = this.decodeJWTToken(token);
    console.log('decodedToken', decodedToken);
    if (decodedToken.user.role?.length > 0) {
      console.log('decodedToken.user', decodedToken.user);
      this.getAccessTypes();
      this.getPermissionsByRole(decodedToken.user.role[0]);
      this.setLoginStatus(true);
      this.rolesSubject.next(decodedToken.user.role);

    }
  }

  async register(signUpData: SignUpData): Promise<any> {
    console.log(signUpData.isSocialUser ? 'Social User' : 'Not Social User', signUpData);
    console.log('signUpData', signUpData);

    const body = signUpData;
    const targetUrl = `${environment.apiUrl}${environment.serverPaths.register}`;

    try {
      this.registrationRequest = this.http.post(targetUrl, body,
        {
          withCredentials: false
        });


      this.registrationRequest
        .pipe(take(1))
        .subscribe((response: any) => {
          console.log('registrationRequest', response);
          console.log('USER ID', response.userId);
          console.log('REQUEST ID', response.requestId);

          this.dialog.open(NotificationWindowComponent,
            {
              data:
              {
                message: "User has been created! Please, check your email to complete the registration!"
              }
            });

          if (signUpData.isSocialUser) {
            this.router.navigate([environment.serverPaths.login]);
          }

          else if (!signUpData.isSocialUser) {
            this.router.navigate([
              `${environment.routes.authentication}`,
              `${response.userId}`,
              `${environment.routes.auth.emailVerification}`,
              `${response.requestId}`
            ]);
          }
        },
          (err) => {
            console.error('err', err, err.code, err.error.response.message);
            this.notificationMessageSubject.next(err.error.response.message);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: `${err.error.response.message}` }
            });
          });
      console.log('Auth Service', this.registrationRequest);
      return this.registrationRequest;
    } catch (ex) {
      console.error('login', ex);
    }
    return Observable.create();
  }

  public get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  logout(): void {
    this._isLoggedIn = false;
    console.log('Storage info', `${environment.storage}`);
    try {
      sessionStorage.removeItem(`${environment.storage.currentUser}`);
      const userId = sessionStorage.getItem(`${environment.storage.userId}`);
      if (userId) {
        sessionStorage.removeItem(`${environment.storage.prefixToken}${userId}`);
        sessionStorage.removeItem(`${environment.storage.prefixToken}${userId}_refresh`);
      }
      sessionStorage.removeItem(`${environment.storage.userId}`);
      sessionStorage.clear();

      this.loginStatusSubject.next(false);
    } catch (ex) {
      console.log('Error loging out', ex);
    }
    this.router.navigate(['/main']);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}

// export function getEnumKey<T extends Record<string, string>>(enumObj: T, value: string): keyof T {
//   return Object.keys(enumObj).find(key => enumObj[key as keyof T] === value) as keyof T;
// }


export function convertRoleToRoute(roles: string[]): any {
  if (roles.length === 0) {
    return ROLES.GENERAL;
  }
  const adminPrefixes = ['ADMIN', 'SA'];
  const moderatorPrefixes = ['MD', 'MODERATOR'];;
  const customerManagerPrefixes = ['CM', 'CRM', 'CUSTOMER_MANAGER'];
  const recruitmentPrefixes = ['HM', 'SE', 'HR', 'RC', 'HH',
    'TALENT_ACQUISITION_MANAGER',
    'TALENT_ACQUISITION',
    'RECRUITMENT',
    'RECRUITER',
    'HUMAN_RESOURCES',
    'HR_MANAGER',
    'OPPORTUNITYMANAGER',
    'OPPORTUNITY_MANAGER'
  ];

  const talentsPrefixes = ['TJA', 'TJAM', 'TJASME', 'TALENT', 'CANDIDATE', 'JA', 'JOB_APPLICANT', 'TALENT_MANAGER',];
  const stakeholdersPrefixes = ['SH', 'LD', 'CS', 'STAKEHOLDER', 'CUSTOMER', 'LEAD'];

  if (roles.some(item => adminPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.ADMIN.toLocaleLowerCase();
  }
  if (roles.some(item => moderatorPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.MODERATOR.toLocaleLowerCase();
  }
  if (roles.some(item => customerManagerPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.CUSTOMERMANAGER.toLocaleLowerCase();
  }

  if (roles.some(item => recruitmentPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.RECRUITMENT.toLocaleLowerCase();
  }
  if (roles.some(item => talentsPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.TALENT.toLocaleLowerCase();
  }
  if (roles.some(item => stakeholdersPrefixes.includes(item.toLocaleUpperCase()))) {
    return ROLES.STAKEHOLDER.toLocaleLowerCase();
  }
}
