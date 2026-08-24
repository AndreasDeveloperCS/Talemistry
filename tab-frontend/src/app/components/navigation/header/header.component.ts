import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, map, Observable, startWith, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../modules/authentication/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  private dashboardRoutes = ['talent', 'recruitment', 'admin'];
  isLoggedIn$: Observable<boolean>;
  showHeader$: Observable<boolean>;
  showHeader = false;

  constructor(
    private router: Router,
    private mainAuthService: AuthService,
    private cdr: ChangeDetectorRef
  ) { 
    this.isLoggedIn$ = this.mainAuthService.loginStatus$;
    this.showHeader$ = combineLatest([
      this.isLoggedIn$.pipe(startWith(false)), // ⬅️ important
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        map((e: NavigationEnd) => e.urlAfterRedirects),
        startWith(this.router.url)
      )
    ]).pipe(
      map(([isLoggedIn, url]) =>
        !isLoggedIn || !this.dashboardRoutes.some(r => url.includes(r))
      ),
      startWith(false) // ⬅️ prevents first paint flash
    );
  }

  ngOnInit() {
    this.showHeader = this.shouldShowHeader(this.router.url);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private shouldShowHeader(url: string): boolean {
    return this.mainAuthService.isLoggedIn === false
      || !this.dashboardRoutes.some(route => url.includes(route));
  }

  onLogin() {
    this.router.navigate([environment.serverPaths.login]);
  }

  onRegistration() {
    this.router.navigate([environment.serverPaths.register]);
  }

  onPositions() {
    this.router.navigate([environment.routes.positions]);
  }

  onMainPage() {
    this.router.navigate(['/']);
  }

  logOut() {
    this.mainAuthService.logout();
  }
}
