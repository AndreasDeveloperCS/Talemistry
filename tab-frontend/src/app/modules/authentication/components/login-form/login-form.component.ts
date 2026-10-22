import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthRedirectService } from 'src/app/modules/general/services/auth-redirect.service';
import { GoogleIdentityService } from 'src/app/modules/general/services/google-identity.service';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';
import { ROLES } from '../../models/roles';
import { SignInData, SignInInfo } from '../../models/signin-signup-info';
import { SocialUser, UserData } from '../../models/user-data';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent implements OnInit, AfterViewInit {
  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  public signInData = new SignInData();

  @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;

  form: FormGroup<SignInInfo> = new FormGroup<SignInInfo>({// new FormGroup<CandidateInfo>({
    email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
    password: new FormControl('', [Validators.required])
  });

  accessToken: any;
  user!: SocialUser;
  loggedIn!: boolean;
  invalidCredentials: boolean = false;
  notificationMessages: string[] = [];
  notificationErrors: string = '';
  isPasswordVisible: boolean = true;
  roles: typeof ROLES = ROLES;
  capchaKey = environment.RECAPTCHA_KEY_V2;
  returnUrl!: any;

  constructor(
    private mainAuthService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authRedirect: AuthRedirectService,
    private googleIdentity: GoogleIdentityService,
    public content: ContentService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || undefined;

    this.handleGoogleRedirectResult();
  }

  ngAfterViewInit() {
    if (this.googleButtonRef) {
      this.googleIdentity
        .renderButton(this.googleButtonRef.nativeElement, (idToken) => this.onGoogleCredential(idToken), { text: 'signin_with' })
        .catch((error) => console.error('Google button render failed', error));
    }
  }

  /** Finishes the server-side Google OAuth redirect flow: the backend
   *  appends session tokens (success) or `error` (failure) to this page. */
  private handleGoogleRedirectResult() {
    const params = this.route.snapshot.queryParamMap;
    const googleToken = params.get('googleToken');
    const googleRefreshToken = params.get('googleRefreshToken');
    const googleUserId = params.get('googleUserId');
    const googleError = params.get('error');

    if (googleToken && googleRefreshToken && googleUserId) {
      this.mainAuthService.handleLogin({ id: googleUserId, token: googleToken, refreshToken: googleRefreshToken });
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.authRedirect.redirectIfSaved();
      }
      return;
    }

    if (googleError) {
      this.manageNotificationMessage(this.content.notificationInvalidCredentials);
      this.cdr.markForCheck();
    }
  }

  /** Called with the credential ID token once the user completes the Google button flow. */
  onGoogleCredential(idToken: string) {
    this.mainAuthService.loginWithGoogle(idToken)
      .pipe(take(1))
      .subscribe({
        next: (result: any) => {
          this.mainAuthService.handleLogin(result?.userData);
          if (this.returnUrl) {
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.authRedirect.redirectIfSaved();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.manageNotificationMessage(this.content.notificationInvalidCredentials);
          console.error('onGoogleCredential', error);
          this.cdr.markForCheck();
        }
      });
  }

  @HostListener('document:keydown', ['$event'])
  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.signIn();
    }
  }

  signIn() {
    if (this.form.valid) {
      this.mainAuthService.login(this.signInData)?.
        pipe(take(1))
        .subscribe({
          next: (userData: UserData) => {
            if (this.returnUrl) {
              this.router.navigateByUrl(this.returnUrl);
            } else {
              this.authRedirect.redirectIfSaved();
            }
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.manageNotificationMessage(`${this.content.notificationInvalidCredentials}`);
            this.notificationErrors = error.message;
            setTimeout(() => {
              this.notificationErrors = "";
              this.cdr.markForCheck();
            }, 7000);
            console.error('signIn', error);
          }
        });
    } else {
      this.manageNotificationMessage(this.content.notificationLoginFormNotValid);
      this.cdr.markForCheck();
    }
  }

  manageNotificationMessage(message: string) {
    console.log('manageNotificationMessage', message, this.notificationMessages);
    if (!this.notificationMessages.includes(message)) {
      this.notificationMessages.push(message);
      setTimeout(() => {
        const index = this.notificationMessages.indexOf(message, 0);
        if (index > -1) {
          this.notificationMessages.splice(index, 1);
        }
        this.cdr.markForCheck();
      }, 10000);
    }
  }

  onInputChange() {
    this.invalidCredentials = false;
  }

  tooglePasswordVisible() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onRegistration() {
    console.log('onRegistration', environment.serverPaths.register);
    this.router.navigate([environment.serverPaths.register], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : undefined,
    });
  }

  onPasswordRecovery() {
    this.router.navigate([environment.routes.auth.passwordRecovery]);
  }
}
