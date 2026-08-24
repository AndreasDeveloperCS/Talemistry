import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserCredentialsService } from '../../services/user-credentials.service';
import { ContentService } from '../../../../general/services/content.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserCredentials } from '../../../../authentication/models/user';
import { take } from 'rxjs';
import { PasswordValidationService } from '../../services/password-validation.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordDialogComponent {
  userInfoForm: FormGroup;
  infoMessage!: string | undefined;
  warningMessage!: string | undefined;
  errorMessage!: string | undefined;

  get isSaveButtonDiabled(): boolean {
    // console.log();

    return this.userInfoForm.invalid
      || !this.userInfoForm.touched
      || this.userInfoForm.value.currentPassword == ""
      || this.userInfoForm.value.newPassword == ""
      || this.userInfoForm.value.repeatNewPassword == "";
  }

  isPasswordVisible: boolean = true;

  constructor(
    private userCredentialsService: UserCredentialsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private passwordValidationService: PasswordValidationService,
    public content: ContentService,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
  ) {
    this.userInfoForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, ...this.passwordValidationService.createPasswordValidator(8)]],
      repeatNewPassword: ['', Validators.required]
    }, {
      validators: [
        this.passwordValidationService.passwordMatchValidator(),
      ]
    });
  }

  tooglePasswordVisible() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const repeatNewPassword = form.get('repeatNewPassword')?.value;
    return newPassword != '' && repeatNewPassword != '' && newPassword === repeatNewPassword ? { mismatch: false } : { mismatch: true };
  }

  onSubmit() {
    if (this.userInfoForm.valid) {
      const credentials: UserCredentials = this.data;
      console.log('UserCredentials', credentials);

      credentials.password = this.userInfoForm.get('currentPassword')?.value;
      credentials.newPassword = this.userInfoForm.get('newPassword')?.value;
      this.userCredentialsService.updateAsync(credentials, true, false).pipe(take(1)).subscribe((result: any) => {

        if (result.succeed) {
          this.infoMessage = result.message;
          setTimeout(() => {
            this.infoMessage = undefined;
            this.dialogRef.close();
            this.cdr.markForCheck();
          }, 5000)
        }

      }, (error: any) => {
        if (!error.succeed) {
          // console.log(error);
          this.errorMessage = error.error.message;
          setTimeout(() => {
            this.errorMessage = undefined;
            this.cdr.markForCheck();
          }, 5000)
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
