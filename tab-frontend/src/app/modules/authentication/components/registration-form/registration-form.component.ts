import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RecaptchaComponent } from 'ng-recaptcha-2';
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
export class RegistrationFormComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('captchaRef')
  public recaptcha?: RecaptchaComponent;

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
