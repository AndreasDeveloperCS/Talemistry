import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let url: string = state.url;
    return this.checkLogin(url);
  }

  checkLogin(url: string): boolean {
    // if (this.authService._isLoggedIn) {
    //   return true;
    // }

    this.authService.redirectUrl = url;
    const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`);
    if (idToken) {
      return true;
    }

    this.router.navigate([environment.routes.auth.login], { queryParams: { returnUrl: url } });
    return false;
  }

  checkPermissions() {
    return true;
  }
}
