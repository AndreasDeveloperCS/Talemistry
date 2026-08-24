
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { CRUDService } from '../../../general/services/crud.service';
import { User } from '../../../authentication/models/user';
import { environment } from '../../../../../environments/environment';
import { PaginatedResource } from '../../../general/services/search-logic.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { MessageNotificationPreferences } from 'src/app/modules/communication/models/notification-channel';

export interface DirectChatContactLookup {
  contactId: string;
  contactName: string;
  email?: string;
  phone?: string;
  username?: string;
  pseudonym?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService extends CRUDService<User> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.userProfiles}`;

  userId!: string;
  user: User = new User();
  public userBehaviorSubject: BehaviorSubject<User> = new BehaviorSubject<User>(this.user);

  public usersBehaviorSubject = new BehaviorSubject<PaginatedResource<User>>(this.paginationResource);
  public usersBehaviorSubject$: Observable<PaginatedResource<User>> = this.usersBehaviorSubject.asObservable();

  private apiBaseUrl = `${environment.apiUrl}${environment.serverPaths.changePassword}`;

  constructor(http: HttpClient, private authService: AuthService) {
    super(http);
    this.inheritedClassName = this.constructor.name;
  }

  //TODO : Separate service
  verifyCurrentPassword(currentPassword: string, valid: boolean): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiBaseUrl}/verify-current-password`, { currentPassword });
  }

  sendVerificationCode(): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/send-verification-code`, {});
  }

  verifyCode(code: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.apiBaseUrl}/verify-code`, { code });
  }

  generateTelegramConnectToken(isProtected: boolean = true): Observable<{ token: string }> {
    const url = `${this.tartgetUrl}/telegram/connect-token`;
    const request = this.http.post<{ token: string }>(url, {},
      {
        withCredentials: true,
        headers: this.getHttpHeaders(isProtected),
        observe: "body",
        reportProgress: true,
        responseType: "json",
      }
    );
    return request;
  }

  getTelegramStatus(isProtected: boolean = true): Observable<any> {
    const url = `${this.tartgetUrl}/me/telegram-status`;
    const request = this.http.get<any>(url, {
      withCredentials: true,
      headers: this.getHttpHeaders(isProtected),
    });
    return request;
  }

  resetTelegram(isProtected: boolean = true): Observable<void> {
    const url = `${this.tartgetUrl}/telegram/reset`;
    const request = this.http.post<void>(url, {},
      {
        withCredentials: true,
        headers: this.getHttpHeaders(isProtected),
        observe: 'body',
        reportProgress: true,
        responseType: 'json',
      }
    );

    return request;
  }

  getMessagePreferencesById(userId: string, isProtected: boolean = true): Observable<MessageNotificationPreferences> {
    return this.http.get<MessageNotificationPreferences>(`${this.tartgetUrl}/message-preferences/${userId}`, {
      headers: this.getHttpHeaders(isProtected),
      // This endpoint is authenticated via headers; sending cookies cross-origin
      // causes browsers to reject responses that use `Access-Control-Allow-Origin: *`.
      withCredentials: false,
    });
  }

  lookupDirectChatContact(identifier: string, isProtected: boolean = true): Observable<DirectChatContactLookup> {
    return this.http.get<DirectChatContactLookup>(`${this.tartgetUrl}/direct-chat-contact`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected,
      params: {
        identifier: String(identifier || '').trim(),
      },
    });
  }
}

