import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';


@Component({
  selector: 'app-permissions-block',
  standalone: false,
  templateUrl: './permissions-block.component.html',
  styleUrl: './permissions-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsBlockComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  currentRoute: string = '';

  routes: { label: string, route: string }[] = [
    { label: "Permissions", route: environment.routes.adminTab.permissions.adminPermissionsList },
    { label: "Roles", route: environment.routes.adminTab.permissions.adminRolesList },
    { label: "Functional Blocks", route: environment.routes.adminTab.permissions.adminFunctionalBlocks },
    { label: "Access Types", route: environment.routes.adminTab.permissions.adminAccessTypes },
  ];

  constructor(
    public dialog: MatDialog,
    public authGuard: AuthGuardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.router.events.pipe(takeUntil(this._onDestroy)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
      this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onTabChanged(event: MatTabChangeEvent): void {
    const route = this.routes[event.index].route;
    this.router.navigate([route]);
  }

  getSelectedTabIndex(): number {
    return this.routes.findIndex(r => this.currentRoute.includes(r.route));
  }
}
