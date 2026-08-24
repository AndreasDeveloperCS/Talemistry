import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { catchError, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { User, UserInfo } from '../../../../authentication/models/user';
import { UserProfileService } from '../../../user-profile/services/user-profile.service';
import { UserProfilePhotoService } from '../../../user-profile/services/user-profile-photo.service';
import { DialogHelperService } from '../../../../general/services/dialog-helper.service';
import { ContentService } from '../../../../general/services/content.service';
import { FormValidationService } from '../../../../general/services/form-validation.service';
import { environment } from '../../../../../../environments/environment';
import { ChangePasswordDialogComponent } from '../../../user-profile/components/change-password-dialog/change-password-dialog.component';
import { ImageCropperDialogComponent } from '../../../user-profile/components/image-cropper-dialog/image-cropper-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { UsersService } from 'src/app/modules/users/services/users.service';
import { ROLES } from 'src/app/modules/authentication/models/roles';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileCardComponent implements OnInit, OnDestroy {
  isEditMode: boolean = false;
  canEditProfile: boolean = false;
  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  private usernameRegx = /^[A-Za-z0-9._-]{3,32}$/;

  user: User = new User();
  userBackup: User = new User();
  loading: boolean = true;
  userId: string = `${sessionStorage.getItem(`${environment.storage.userId}`)}`;

  public inputProfileImageTypes = ['.jpg', '.png', '.bmp', '.jpeg'];

  public fileName = '';

  fileData: {
    file?: any;
    fileInfo?: any;
    fileName?: any;
    profileInfo?: any;
    imageEvent?: any;
  } = {};

  selectedFile: any;
  imgSrc: string = "";
  isSelectedProfileImage!: boolean;

  public get extensions() {
    return `${this.inputProfileImageTypes}`;
  }

  public form: FormGroup<UserInfo> = new FormGroup<UserInfo>({
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(this.phoneRegx),
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern(this.emailRegx),
    ]),
    username: new FormControl('', [Validators.pattern(this.usernameRegx)]),
  });

  public changePasswordVisible = false;
  public showVerificationCodeInput = false;
  public emailVerificationCode: string | null = null;
  public showChangePasswordForm = false;
  protected _onDestroy = new Subject<void>();

  get publicIdentity(): string {
    const alias = this.getSafeText(this.user.username || this.user.login);
    if (alias) {
      return alias.startsWith('@') ? alias : `@${alias}`;
    }

    const emailHandle = this.getSafeText(this.user.email).split('@')[0];
    if (emailHandle) {
      return `@${emailHandle}`;
    }

    const firstName = this.getSafeText(this.user.firstname);
    if (firstName) {
      return `@${firstName.toLowerCase()}`;
    }

    return '@member';
  }

  get identitySupportLabel(): string {
    const firstName = this.getSafeText(this.user.firstname);
    return firstName ? `${firstName}'s private profile` : 'Private profile';
  }

  get identityAccentColor(): string {
    const seed = this.getSafeText(this.user.username || this.user.login || this.user.email || this.user.firstname || 'member');
    let hash = 0;

    for (let index = 0; index < seed.length; index += 1) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(index);
      hash |= 0;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 88% 62%)`;
  }
  constructor(
    private userProfileService: UserProfileService,
    private usersService: UsersService,
    private userProfilePhotoService: UserProfilePhotoService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public dialogHelper: DialogHelperService,
    public content: ContentService,
    private mainAuthService: AuthService,
    public validator: FormValidationService
  ) { }

  ngOnInit(): void {
    console.log(this.constructor.name, 'ngOnInit userID', this.userId);

    this.canEditProfile = !!this.userId;

    const profile$ = this.userId
      ? this.userProfileService.getByIdAsync(this.userId, true)
      : of(null);

    const photo$ = this.userProfilePhotoService.getPhotoUrlByIdAsync(this.userId, true)
      .pipe(
        catchError(err => {
          console.warn('Photo request failed, using default image', err);
          return of({ url: null });
        })
      );

    forkJoin({
      user: profile$,
      photo: photo$
    })
      .pipe(takeUntil(this._onDestroy))
      .subscribe({
        next: ({ user, photo }) => {
          console.log('Profile ngOnInit', user, 'Profile photo', photo);

          if (user) {
            this.userProfileService.user = user;
            this.userProfileService.userBehaviorSubject.next(user);
            this.user = user;
            this.syncFormWithUser();
          }

          if (!photo.url) {
            console.warn('Photo is empty, using default image.');
            this.imgSrc = '';
          } else {
            this.imgSrc = photo.url;
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading profile data:', error);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  triggerFileInput(fileInput: HTMLInputElement, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    fileInput?.click();
  }

  openChangePasswordDialog(): void {
    const callback = (result: any) => {
      if (result) {
        console.log('new and old password', result);
        this.cdr.markForCheck();
      }
    };
    this.dialogHelper.openDialog(ChangePasswordDialogComponent, callback, { panelClass: 'panel-class-dialog', data: this.user });
  }

  updateProfilePhoto() {
    this.userProfilePhotoService.update(this.fileData.fileInfo);
    this.cdr.markForCheck();
  }

  onFileSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {
        this.fileData = {
          imageEvent: node,
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name,
        };
        const callback = (croppedDataImageContainer: any) => {
          if (croppedDataImageContainer) {
            //this.selectedFile = croppedDataImageBlob;
            console.log(croppedDataImageContainer);
            this.imgSrc = URL.createObjectURL(croppedDataImageContainer.image);
            console.log(this.imgSrc);
            this.userProfilePhotoService.update(croppedDataImageContainer.image, croppedDataImageContainer.imageInfo?.name);
            console.log(croppedDataImageContainer);
          } else {
            console.error('Failed to update profile photo');
          }
          this.cdr.markForCheck();
        };
        this.dialogHelper.openDialog(ImageCropperDialogComponent, callback,
          {
            //panelClass: 'panel-class-dialog',
            data: {
              file: this.fileData.file,
              fileInfo: this.fileData.fileInfo,
              fileName: this.fileData.fileName,
              imageEvent: this.fileData.imageEvent
            }
          });
      };

      this.fileName = inputNode.files[0].name;
      this.isSelectedProfileImage = this.fileName != undefined && this.fileName != null;
      reader.readAsText(inputNode.files[0]);
      this.cdr.markForCheck();
    }
  }

  enterEditMode() {
    this.userBackup.firstname = this.user.firstname;
    this.userBackup.lastname = this.user.lastname;
    this.userBackup.email = this.user.email;
    this.userBackup.phone = this.user.phone;
    this.userBackup.username = this.user.username;
    this.syncFormWithUser();

    this.isEditMode = true;
  }

  saveProfile() {
    console.log('saveProfile', this.form.valid, this.user);
    //this.resetTelegram();
    if (this.form.valid) {
      this.userProfileService.updateAsync(this.user, true)
        .pipe(take(1)).subscribe({
          next: (user: User) => {
            console.log('user updated', user);
            //this.user = user;
            this.userBackup.username = this.user.username;
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "User has been updated!" }
            });
            this.isEditMode = false;
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error("Error while updating the user!", err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the user!" }
            });
          }
        });
    } else {
      this.dialog.open(WarningsErrorsDialogComponent, {
        data: { message: "Error while updating the user!" }
      });
    }
  }

  deleteProfile(): void {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete user profile with ID: ${this.user._id}`);
        this.usersService.deleteAsync(this.user._id, true, true)
          .pipe(take(1)).subscribe({
            next: (res) => {
              console.log('User has been deleted', res);
              this.logOut();
              this.dialog.open(NotificationWindowComponent, {
                data: { message: "Your profile has been deleted." }
              });
            }, error: (err) => {
              console.error("Error while deleting the user!", err);
              this.dialog.open(WarningsErrorsDialogComponent, {
                data: { message: "Error while deleting the user!" }
              });
            }
          });
      } else {
        console.log('Delete action was cancelled');
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  private resetTelegram() {
    this.userProfileService.resetTelegram().pipe(take(1)).subscribe({
      next: () => {
        console.log('Telegram state reset successfully');
      },
      error: (err) => {
        console.error('Error resetting Telegram state', err);
      }
    });
  }

  public resetForm(): void {
    console.log('resetForm', this.userBackup);
    this.user.firstname = this.userBackup.firstname;
    this.user.lastname = this.userBackup.lastname;
    this.user.email = this.userBackup.email;
    this.user.phone = this.userBackup.phone;
    this.user.username = this.userBackup.username;
    this.syncFormWithUser();
    this.isEditMode = false;
  }

  private getSafeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private syncFormWithUser(): void {
    this.form.patchValue({
      firstname: this.user.firstname || '',
      lastname: this.user.lastname || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      username: this.user.username || '',
    }, { emitEvent: false });
  }

  logOut() {
    this.mainAuthService.logout();
  }
}
