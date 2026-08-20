import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService, convertRoleToRoute } from '../../../../authentication/services/auth.service';
import { environment } from '../../../../../../environments/environment';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthGuardService } from '../../../../authentication/guard/auth-guard.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit, OnDestroy {
  userRoles: string[] = [];
  protected _onDestroy = new Subject<void>();

  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public authGuard: AuthGuardService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    const roles = this.authService.getRoles();
    if (roles && roles.length > 0) {
      this.router.navigate([environment.routes.userProfile,
        // , 
        userId,
      convertRoleToRoute(roles),]);
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
