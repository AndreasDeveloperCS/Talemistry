import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService, convertRoleToRoute } from '../../../modules/authentication/services/auth.service';
import { UserProfilePhotoService } from '../../../modules/profiles/user-profile/services/user-profile-photo.service';

@Component({
  selector: 'app-login-field',
  templateUrl: './login-field.component.html',
  styleUrl: './login-field.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFieldComponent implements OnInit, OnDestroy {
  @ViewChild('authIcon') authIcon!: ElementRef;

  private _showLogoutDialog: boolean = false;
  protected _onDestroy = new Subject<void>();
  userId: string = `${sessionStorage.getItem(`${environment.storage.userId}`)}`;

  imgSrc: string = "";
  isLoggedIn$: Observable<boolean>;

  public get showLogoutDialog(): boolean {
    return this._showLogoutDialog;
  }
  public set showLogoutDialog(value: boolean) {
    this._showLogoutDialog = value;
  }

  constructor(
    private userProfilePhotoService: UserProfilePhotoService,
    private cdr: ChangeDetectorRef,
    public mainAuthService: AuthService, 
    private router: Router
  ) {
    this.isLoggedIn$ = this.mainAuthService.loginStatus$;
   }

  ngOnInit(): void {

    if (this.isLoggedIn$) {
      this.updateLoginPhoto(true);
    }

    this.mainAuthService
      .loginStatus$
      .pipe(takeUntil(this._onDestroy))
      .subscribe((isLogged) => {
        if (isLogged) {
          this.updateLoginPhoto(true);
        }
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private updateLoginPhoto(isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.userProfilePhotoService.getPhotoUrlByIdAsync(this.userId, true)
      .pipe(take(1)).subscribe({
        next: (photo) => {
          if (!photo) {
            console.warn('Photo is empty, using default image.');
            this.imgSrc = '';
          } else {
            this.imgSrc = photo.url;
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching the image:', error);
          this.cdr.markForCheck();
        },
      }),
      catchError(err => {
        console.warn('Photo request failed, using default image', err);
        return of({ url: null });
      });
    }
  }

  loginAction() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);

    if (userId) {
      this.openProfilePage();
    }
    else {
      this.router.navigate([environment.routes.auth.login]);
    }
  }

  logoutAction() {
    this.showLogoutDialog = !this.showLogoutDialog;
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);

    if (userId) {
      this.openProfilePage();
    }
  }

  openProfilePage() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (!userId) {
      return;
    }
    const roles = this.mainAuthService.getRoles();
    if (roles && roles.length > 0) {
      this.router.navigate([environment.routes.userProfile,
        userId,
        convertRoleToRoute(roles),
      ]);
    }
  }
}
