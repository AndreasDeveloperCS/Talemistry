import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { HttpService } from '../../../general/services/http.service';
import { VerificationEmailData, VerificationEmailInfo } from '../../models/signin-signup-info';
import { EmailVerificationService } from '../../services/email-verification.service';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailVerificationComponent implements OnInit, AfterViewChecked {
  public capchaKey = environment.RECAPTCHA_KEY_V2;
  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  public verificationData = new VerificationEmailData();
  public verificationForm: FormGroup<VerificationEmailInfo>;
  public user: any;
  public notificationMsg?: string = undefined;
  public isSuccessful?: boolean = false;
  public decreasingCounter: number = 3;

  constructor(private formBuilder: FormBuilder,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    public httpService: HttpService,
    private dialogHelperService: DialogHelperService,
    private emailVerificationService: EmailVerificationService,
    public activatedRoute: ActivatedRoute,
    public router: Router) {
    
    console.log('Constructor verificationData', this.verificationData.email);
    console.log(this.constructor.name, activatedRoute, activatedRoute.snapshot.queryParams['code']);

    this.verificationData.requestId = this.activatedRoute.snapshot.params['requestId'];
    this.verificationData.userId = this.activatedRoute.snapshot.params['userId'];
    const code = activatedRoute.snapshot.queryParams['code'] ?? '';
    this.verificationData.verificationCode = code;

    this.verificationForm = formBuilder.group<VerificationEmailInfo>({
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
      verificationCode: new FormControl(code, [Validators.required]),
      password: new FormControl('', [Validators.required, this.matchValidator('confirmPassword', false)],),
      confirmPassword: new FormControl('', [Validators.required, this.matchValidator('password', true)]),
      recaptcha: new FormControl('',
        //  [Validators.required]
      ),
    });
  }

  ngOnInit(): void {
    console.log('ngOnInit', this.verificationData);
    console.log('ngOnInit', this.verificationData.userId);
    console.log('ngOnInit', this.verificationData.requestId);
    if (this.verificationData.requestId != undefined) {
      console.log('Before getByIdAsync');
      this.emailVerificationService.getByIdAsync(this.verificationData.requestId)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            console.log('EMAIL VERIFICATION Response', response);
            if (response != null) {
              if (response.isVerified) {
                this.dialogHelperService.openDialog(NotificationWindowComponent, () => { }, {
                  data: "Verification Code has been already used. Email has been veridied"
                });
                this.cdr.markForCheck();
                return;
              }
              this.user = response;
              console.log('user', this.user);
              this.verificationData.email = this.user.email;
              this.cdr.markForCheck();
            }
          }, error: (err) => {
            console.error('Error while getting the verification code', err);
            this.cdr.markForCheck();
          }
        });
    }
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  isValid(): boolean {
    return !this.verificationForm.valid;
  }

  onVerify() {
    if (this.verificationData.userId != undefined
      && this.verificationData.requestId != undefined
      && this.verificationForm.valid) {

      sessionStorage.setItem("verification-data", JSON.stringify(this.verificationData));
      this.httpService.verifyEmailAsync(this.verificationData)
        .pipe(take(1))
        .subscribe((response: any) => {
          console.log('verification-data', response);

          this.showNotificationMessage(this.content.txtNewPasswordHasBeenSetUp, true);
          const intervalRef = setInterval(() => {
            this.decreasingCounter -= 1;

            if(this.decreasingCounter === 0) {
              clearInterval(intervalRef);
              this.verificationForm.reset();
              this.router.navigate([environment.routes.auth.login]);
            }
            this.cdr.markForCheck();
          }, 1000);
        }, (error: any) => {
          this.showNotificationMessage(error.error.message, false);
          this.cdr.markForCheck();
        });
    }
  }

  showNotificationMessage(notificationMsg: string, isSuccessful: boolean) {
    this.notificationMsg = notificationMsg;
    this.isSuccessful = isSuccessful;
    setTimeout(() => {
      this.notificationMsg = undefined;
      this.isSuccessful = false;
      this.cdr.markForCheck();
    }, 7000);
  }

  comparePasswords() {
    return this.createCompareValidator(
      this.verificationForm?.get('password'),
      this.verificationForm?.get('confirmPassword')
    );
  }

  createCompareValidator(controlOne: AbstractControl | null, controlTwo: AbstractControl | null) {
    return () => {
      if (controlOne?.value !== controlTwo?.value)
        return { match_error: 'Passwords do not match' };
      return null;
    };
  }

  matchValidator(
    matchTo: string,
    reverse?: boolean
  ): ValidatorFn {
    return (control: AbstractControl):
      any => {
      if (control?.parent && reverse) {
        const c = (control?.parent?.controls as any)[matchTo] as AbstractControl;
        if (c) {
          c.updateValueAndValidity();
        }
        return null;
      }
      return !!control.parent &&
        !!control.parent.value &&
        control.value ===
        (control.parent?.controls as any)[matchTo].value
        ? null
        : { matching: true };
    };
  }
}
