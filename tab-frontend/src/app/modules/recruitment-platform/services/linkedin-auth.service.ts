import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LinkedInAuthService {
  private accessTokenUrl = `${environment.apiUrl}${environment.serverPaths.linkedInRecruitmentPlatform}/${environment.serverPaths.authLinkedIn}`;

  private readonly clientId = `${environment.socialLogin.LINKEDIN.CLIENT_ID}`;
  private readonly redirectUri = `${environment.sourceUrl}/${environment.routes.adminTab.career}/${environment.serverPaths.recruitmentPlatform}/${environment.serverPaths.linkedInBlogs}`;
  private readonly scope = 'openid profile w_member_social email r_liteprofile';
  public tokenReceivedBehaviorSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor(private http: HttpClient) { }

  getLinkedInCode() {
    console.log('getLinkedInToken');
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(this.scope)}`;
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const authWindow = window.open(authUrl, 'LinkedInAuth',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  }

  getAccessToken(code: string, userId: any): Observable<any> {
    console.log('LinkedInAuthService', code);
    return this.http.post(`${this.accessTokenUrl}`, { code, userId });
  }

  
}