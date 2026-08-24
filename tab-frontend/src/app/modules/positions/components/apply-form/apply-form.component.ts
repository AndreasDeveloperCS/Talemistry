import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { GdprPolicyConfirmationFormComponent } from '../../../general/components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';
import { environment } from '../../../../../environments/environment';
import { CandidateInfoData, CandidateInfoForm } from '../../../profiles/user-profile/models/candidate-info';
import { OpenPosition } from '../../models/position';
import { GdprPolicyModel } from '../../../general/models/gdpr-model';
import { FileData } from '../../../general/models/file-data';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { ContentService } from '../../../general/services/content.service';
import { GdprService } from '../../../general/services/gdpr.service';
import { HttpService } from '../../../general/services/http.service';
import { CandidateInfoConverterService } from '../../../expertise/services/candidate-info-converter.service';
import { CVService } from '../../../expertise/services/cv.service';

@Component({
  selector: 'app-apply-form',
  templateUrl: './apply-form.component.html',
  styleUrl: './apply-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplyFormComponent implements OnInit, AfterViewChecked {

  public capchaKey = environment.RECAPTCHA_KEY_V2;
  public candidateInfoData: CandidateInfoData = new CandidateInfoData();

  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf'];
  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  private contactFullName = /^[\w\s]{0,100}$/;

  public get isSelectedCv(): boolean {
    return this.fileName != undefined && this.fileName != null;
  }
  private selectedFile!: File;

  public gdprConfirmationStatus: boolean = false;

  public isJustSent: boolean = false;
  public isApplied: boolean = false;
  @Input()
  position!: OpenPosition;

  public gdprContent: GdprPolicyModel = new GdprPolicyModel();

  public fileName = '';
  fileData!: FileData;
  candiateInfo: any;

  public get selectedFileName() {
    return this.fileName == '' || this.fileName == undefined ? this.content.txtSelectCVPlaceholder : this.fileName;
  }

  public set selectedFileName(value) {
    this.fileName = value;
  }

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  public candidateForm: FormGroup<CandidateInfoForm> = new FormGroup<CandidateInfoForm>({
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required, Validators.pattern(this.phoneRegx)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
    recaptcha: new FormControl('', [Validators.required]),
    coverLetterText: new FormControl(''),
    // comment: new FormControl(''),
  });

  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    public content: ContentService,
    private gdprService: GdprService,
    public httpService: HttpService,
    private infoConverterService: CandidateInfoConverterService,
    public cvsService: CVService,
  ) { }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.gdprContent = this.gdprService.getGdprPolicy();
  }

  onGdprConfirmationChanged($event: boolean) {
    this.gdprConfirmationStatus = $event;
  }

  onFileSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {

        this.fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };

        this.selectedFile = node.target.result;
      };

      this.fileName = inputNode.files[0].name;
      reader.readAsText(inputNode.files[0]);
    }
  }

  async onApply() {
    if (this.candidateForm.valid) {

      try {
        if (!this.fileData?.fileInfo || !this.position?._id || this.position?._id == '') {
          return;
        }
        const infoCVEnvelope = this.infoConverterService
          .getInfoFullEnvelope(this.fileData
            , this.candidateInfoData.coverLetterText
            , this.position._id
          );

        infoCVEnvelope.candidateInfo = this.candidateInfoData;
        infoCVEnvelope.positionId = this.position._id;

        this.isApplied = true;

        this.cvsService.upload(this.fileData, infoCVEnvelope, []).pipe(take(1)).subscribe((result: any) => {
          this.isJustSent = true
          setTimeout(() => {
            this.isJustSent = false
            this.isApplied = false;
            this.candidateForm.reset();
            this.changeDetectorRef.markForCheck();
          }, 7000);
        });
        this.changeDetectorRef.markForCheck();
      } catch (ex) {
        console.error('Error upload all', ex);
        this.changeDetectorRef.markForCheck();
      }
    }
  }

  openPrivacyPolicy() {
    this.dialogHelper.openDialog(
      GdprPolicyConfirmationFormComponent
      , (status: boolean) => {
        if (status) {
          this.gdprConfirmationStatus = status;
        }
        this.changeDetectorRef.markForCheck();
      }, {
      data: this.gdprConfirmationStatus,
      panelClass: "general-panel-class-dialog", isFullScreen: true
    });
  }
}
