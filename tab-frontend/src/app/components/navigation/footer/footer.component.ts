import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { combineLatest, filter, map, Observable, startWith, Subject } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  private dashboardRoutes = ['talent', 'recruitment', 'admin'];
  isLoggedIn$: Observable<boolean>;
  showFooter$: Observable<boolean>;
  showFooter = false;

  constructor(
    private router: Router,
    private mainAuthService: AuthService,
    private cdr: ChangeDetectorRef
  ) { 
    this.isLoggedIn$ = this.mainAuthService.loginStatus$;
    this.showFooter$ = combineLatest([
      this.isLoggedIn$.pipe(startWith(false)),
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
    this.showFooter = this.shouldShowFooter(this.router.url);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private shouldShowFooter(url: string): boolean {
    return this.mainAuthService.isLoggedIn === false
      || !this.dashboardRoutes.some(route => url.includes(route));
  }

  navigateToPrivacyPolicy() {
    this.router.navigate([environment.routes.privacyPolicy]);
  }

  navigateToPositions() {
    this.router.navigate([environment.routes.positions]);
  }

  navigateToPricingPlans() {
    this.router.navigate([environment.routes.pricingPlans]);
  }
}
 