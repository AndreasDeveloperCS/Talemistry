import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PasswordRecoveryData, PasswordRecoveryInfo } from '../../models/signin-signup-info';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-recovery-password',
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryPasswordComponent implements OnDestroy {
  capchaKey = environment.RECAPTCHA_KEY_V2;

  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  public passwordRecovery: FormGroup<PasswordRecoveryInfo>;
  public passwordRecoveryData = new PasswordRecoveryData();
  public recoveryErrors: string = '';
  public notificationMsg?: string = undefined;
  public isSuccessful?: boolean = false;
  public incrementDifference: number = 5000;
  public targetDate: Date = new Date();
  public decrementedCounter = 5000;

  protected _onDestroy = new Subject<void>();

  constructor(private formBuilder: FormBuilder,
    public authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    public content: ContentService) {
    this.passwordRecovery = this.formBuilder.group<PasswordRecoveryInfo>({  // new FormGroup<CandidateInfo>({
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
      recaptcha: new FormControl('',
        // [Validators.required]
      ),
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onResetPassword() {
    if (this.passwordRecovery.valid) {

      const recoveryResult = this.authService.recover(this.passwordRecoveryData);

      recoveryResult?.pipe(takeUntil(this._onDestroy)).subscribe(response => {
        if (!response) {
          return;
        }
        this.notificationMsg = this.content.txtNewVerificationCodeMsf;
        this.isSuccessful = true;
        this.targetDate = new Date((Date.now() + this.incrementDifference))
        const intervalRef = setInterval(() => {
          this.decrementedCounter -= 1000;
          this.cdr.markForCheck();
        }, 1000)
        setTimeout(() => {
          this.notificationMsg = "";
          this.router.navigate([environment.routes.authentication, response.userId, 'verification-id', response.requestId]);
          this.isSuccessful = false;
          clearInterval(intervalRef);
          this.cdr.markForCheck();
          //intervalRef.unref();
        }, this.incrementDifference);
        this.cdr.markForCheck();
      }, (error) => {
        this.recoveryErrors = error.error.message;

        setTimeout(() => {
          this.recoveryErrors = "";
          this.cdr.markForCheck();
        }, this.incrementDifference);
        this.cdr.markForCheck();
        console.error('recoveryPassword', error);

      });
    }
  }
}
