import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../authentication/services/auth.service';
import { ROLES } from '../../authentication/models/roles';

@Injectable({
  providedIn: 'root'
})
export class AuthRedirectService {
  private readonly redirectKey = 'redirectAfterLogin';

  constructor(private router: Router,
    private authService: AuthService
  ) {}

  isAuthorized(): boolean {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    return !!userId;
  }

  handleUnauthorizedAction(): void {
    const currentUrl = this.router.url;
    localStorage.setItem(this.redirectKey, currentUrl);
    this.router.navigate([environment.serverPaths.login]); 
  }

  private getNavigationUrl(): string {
    const role = this.authService.getCurrentRole();

    if (role?.includes(ROLES.HR) || role?.includes(ROLES.HM) || role?.includes(ROLES.RC)) {
      return environment.routes.recruitmentTab.dashboard.recruitmentDashboardBlock;
    }

    if (role?.includes(ROLES.TALENT)) {
      return environment.routes.talentTab.dashboard.talentDashboardBlock;
    }

    return environment.routes.userProfile;
  }

  redirectIfSaved(): void {
    const redirectUrl = localStorage.getItem(this.redirectKey);
    if (redirectUrl) {
      localStorage.removeItem(this.redirectKey);
      this.router.navigateByUrl(redirectUrl);
    } else {
      const navigationUrl = this.getNavigationUrl();
      this.router.navigate([navigationUrl]); 
    }
  }
}