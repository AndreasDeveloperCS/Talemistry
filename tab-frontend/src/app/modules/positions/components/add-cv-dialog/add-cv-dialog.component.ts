import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, take, takeUntil } from 'rxjs';
import { RecaptchaComponent } from 'ng-recaptcha-2';
import { environment } from '../../../../../environments/environment';
import { GdprPolicyConfirmationFormComponent } from '../../../general/components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';
import { GdprPolicyModel } from '../../../general/models/gdpr-model';
import { ContentService } from '../../../general/services/content.service';
import { CandidateInfoForm } from '../../../profiles/user-profile/models/candidate-info';
import { GdprService } from '../../../general/services/gdpr.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { CvDataInternalEnvelope } from '../../../profiles/user-profile/models/cv-item';
import { UserProfileService } from '../../../profiles/user-profile/services/user-profile.service';

@Component({
  selector: 'app-add-cv-dialog',
  templateUrl: './add-cv-dialog.component.html',
  styleUrl: './add-cv-dialog.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCvDialogComponent implements OnInit, AfterViewChecked, OnDestroy {
  protected _onDestroy = new Subject<void>();
  public capchaKey = environment.RECAPTCHA_KEY_V2;
  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf'];
  private emailRegx =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  private contactFullName = /^[\w\s]{0,100}$/;
  coverLetterFileName: string = '';
  cvFileName: string = '';

  public get isSelectedCv(): boolean {
    return this.cvFileName != undefined && this.cvFileName != null;;
  }
  private selectedCVFile!: File;
  private selectedCoverLetterFile!: File;

  public gdprConfirmationStatus: boolean = false;

  public gdprContent: GdprPolicyModel = new GdprPolicyModel();

  public get selectedFileName() {
    return this.cvFileName == '' || this.cvFileName == undefined ? this.content.txtSelectCVPlaceholder : this.cvFileName;
  }
  public set selectedFileName(value) {
    this.cvFileName = value;
  }

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  public candidateInfoForm: FormGroup<CandidateInfoForm>;

  constructor(
    private formBuilder: FormBuilder,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<AddCvDialogComponent>,
    public content: ContentService,
    private gdprService: GdprService,
    private dialogHelper: DialogHelperService,
    @Inject(MAT_DIALOG_DATA)
    public data: CvDataInternalEnvelope) {
    if (data && data.info) {
      this.cvFileName = data.cvFileData?.fileName ?? '';
      this.coverLetterFileName = data.coverLetterFileData.length > 0 ? data.coverLetterFileData[0]?.fileName ?? '' : '';
    }
    this.candidateInfoForm = formBuilder.group<CandidateInfoForm>({ 
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.pattern(this.phoneRegx)]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
      coverLetterText: new FormControl(''),
      comment: new FormControl(''),
    });
  }

  ngOnInit(): void {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    this.userProfileService.getByIdAsync(userId, true).pipe(take(1)).subscribe(user => {
      console.log('getByIdAsync', user);
      if (user) {
        this.candidateInfoForm.patchValue({
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone,
          email: user.email
        });

        this.data.info.candidateInfo = {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone
        };
        this.data.info.candidateInfo.firstname = user.firstname;
        this.data.info.candidateInfo.lastname = user.lastname;
        this.data.info.candidateInfo.email = user.email;
        this.data.info.candidateInfo.phone = user.phone;

        this.candidateInfoForm.setValue({
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone,
          email: user.email,
          coverLetterText: '',
          comment: ''
        });
        this.changeDetectorRef.markForCheck();
      }
    });

    this.gdprContent = this.gdprService.getGdprPolicy();
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onGdprConfirmationChanged($event: boolean | any) {
    this.gdprConfirmationStatus = $event;
    console.log('onGdprConfirmationChanged:', this.data.cvFileData, !this.candidateInfoForm.valid, !this.gdprConfirmationStatus, !this.isSelectedCv);
  }

  onCVFileSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {

        this.data.cvFileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };

        // this.selectedCVFile = node.target.result;
        console.log('CV file selected:', this.data.cvFileData, !this.candidateInfoForm.valid, !this.gdprConfirmationStatus, !this.isSelectedCv);

      };
      this.data.cvFileChanged = true;

      this.cvFileName = inputNode.files[0].name;
      reader.readAsText(inputNode.files[0]);
    }
  }

  onCoverLetterFileSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {
        const fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };
        this.data.coverLetterFileData.pop();
        this.data.coverLetterFileData.push(fileData);
        // this.selectedCoverLetterFile= node.target.result;
        console.log('CV file selected:', this.data.cvFileData, !this.candidateInfoForm.valid, !this.gdprConfirmationStatus, !this.isSelectedCv);

      };
      this.data.coverLetterFileChanged = true;
      this.coverLetterFileName = inputNode.files[0].name;
      reader.readAsText(inputNode.files[0]);
    }
  }

  async onApply() {
    if (this.candidateInfoForm.valid) {
      this.data.info.gdprConfirmed = this.gdprConfirmationStatus;

      this.data.info.candidateInfo = {
        firstname: this.candidateInfoForm.get('firstname')?.value,
        lastname: this.candidateInfoForm.get('lastname')?.value,
        email: this.candidateInfoForm.get('email')?.value,
        phone: this.candidateInfoForm.get('phone')?.value,
        coverLetterText: this.candidateInfoForm.get('coverLetterText')?.value,
        comment: this.candidateInfoForm.get('comment')?.value
      }

      this.dialogRef.close(this.data);
    }
  }

  openPrivacyPolicy() {
    this.dialogHelper.openDialog(
      GdprPolicyConfirmationFormComponent
      , (status: any) => {
        console.log('GDPR confirmation status:', status);

        if (status) {
          this.gdprConfirmationStatus = status;
        }
        this.changeDetectorRef.markForCheck();
      }, {
      data: this.gdprConfirmationStatus,
      panelClass: "general-panel-class-dialog"
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
