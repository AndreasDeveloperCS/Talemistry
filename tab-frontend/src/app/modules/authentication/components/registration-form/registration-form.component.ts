import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RecaptchaComponent } from 'ng-recaptcha-2';
import { take } from 'rxjs';
import { AuthRedirectService } from 'src/app/modules/general/services/auth-redirect.service';
import { GoogleIdentityService } from 'src/app/modules/general/services/google-identity.service';
import { environment } from '../../../../../environments/environment';
import { ContentService } from '../../../general/services/content.service';
import { ROLES, ROLES_ICONS, SignUpRoleGroup } from '../../models/roles';
import { SignUpData, SignUpInfo } from '../../models/signin-signup-info';
import { AuthService } from '../../services/auth.service';
import { phoneValidator } from '../../validators/phone.validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationFormComponent implements AfterViewChecked, AfterViewInit, OnDestroy {
  @ViewChild('captchaRef')
  public recaptcha?: RecaptchaComponent;

  @ViewChild('googleButton')
  public googleButtonRef?: ElementRef<HTMLDivElement>;

  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  public signUpData = new SignUpData();
  public signUpForm!: FormGroup<SignUpInfo>;

  roles: typeof ROLES = ROLES;
  signUpRoleGroup: typeof SignUpRoleGroup = SignUpRoleGroup;
  capchaKey = environment.RECAPTCHA_KEY_V2;
  activeTab: ROLES.TALENT | ROLES.RC = ROLES.TALENT;
  rolesIcons = ROLES_ICONS;
  returnUrl?: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    public content: ContentService,
    private changeDetectorRef: ChangeDetectorRef,
    private authRedirect: AuthRedirectService,
    private googleIdentity: GoogleIdentityService,
    public authService: AuthService
  ) {
    this.signUpForm = formBuilder.group<SignUpInfo>({
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
      role: new FormControl(null, [Validators.required]),
      phone: new FormControl('', [Validators.required, phoneValidator()]),
      recaptcha: new FormControl('',
        //[Validators.required]
      ),
      password: new FormControl(''),
      confirmPassword: new FormControl(''),
    });
    this.activeTab = ROLES.TALENT;
    this.signUpForm.get('role')?.setValue(ROLES.TALENT);
    this.signUpData.role = ROLES.TALENT;
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || undefined;
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit(): void {
    if (this.googleButtonRef) {
      this.googleIdentity
        .renderButton(this.googleButtonRef.nativeElement, (idToken) => this.onGoogleCredential(idToken), { text: 'signup_with' })
        .catch((error) => console.error('Google button render failed', error));
    }
  }

  /** Called with the credential ID token once the user completes the Google button flow.
   *  The currently selected Talent/Recruiter tab is passed along as the role to use
   *  if this turns out to be a brand-new account. */
  onGoogleCredential(idToken: string) {
    this.authService.loginWithGoogle(idToken, this.activeTab)
      .pipe(take(1))
      .subscribe({
        next: (result: any) => {
          this.authService.handleLogin(result?.userData);
          if (this.returnUrl) {
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.authRedirect.redirectIfSaved();
          }
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          console.error('onGoogleCredential', error);
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    if (this.recaptcha) {
      const captchaElem = this.recaptcha['elementRef']?.nativeElement;
      captchaElem.parentElement.removeChild(captchaElem);
    }
  }

  onChangeRole(role?: ROLES.TALENT | ROLES.RC) {
    console.log('onChangeRole', role);
    this.activeTab = this.activeTab === ROLES.TALENT ? ROLES.RC : ROLES.TALENT;
    if (this.activeTab === ROLES.TALENT) {
      this.signUpForm.get('role')?.setValue(ROLES.TALENT);
      this.signUpData.role = ROLES.TALENT;
    } else {
      this.signUpForm.get('role')?.setValue(ROLES.RC);
      this.signUpData.role = ROLES.RC;
    }
    console.log(this.signUpData);
  }

  signUp() {
    console.log('signUpData', this.signUpData);
    console.log(this.signUpForm.valid);
    const parsed = parsePhoneNumberFromString(this.signUpForm.value.phone);
    const normalizedPhone = parsed?.number;
    if (normalizedPhone) {
      this.signUpData.phone = normalizedPhone;
    }
    if (this.signUpForm.valid) {
      this.authService.register(this.signUpData);
    }
  }

  onLogin() {
    this.router.navigate([`${environment.serverPaths.login}`], {
      queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : undefined,
    });
  }
}
