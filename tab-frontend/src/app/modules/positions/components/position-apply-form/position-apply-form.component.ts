import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom, take } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';
import { CandidateInfoConverterService } from '../../../expertise/services/candidate-info-converter.service';
import { CVService } from '../../../expertise/services/cv.service';
import { GdprPolicyConfirmationFormComponent } from '../../../general/components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';
import { FileData } from '../../../general/models/file-data';
import { GdprPolicyModel } from '../../../general/models/gdpr-model';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { GdprService } from '../../../general/services/gdpr.service';
import { HttpService } from '../../../general/services/http.service';
import { StageStatus, TalentPipelineProgress } from '../../../position-management/models/talent-pipeline-progress';
import { TalentPipelineProgressService } from '../../../position-management/services/talent-pipeline-progress.service';
import { STAGES_NAMES } from '../../../position-pipelines/models/default-pipeline-stages';
import { PositionPipeline } from '../../../position-pipelines/models/position-pipeline';
import { PositionPipelineService } from '../../../position-pipelines/services/position-pipeline.service';
import { CandidateInfoData, CandidateInfoForm } from '../../../profiles/user-profile/models/candidate-info';
import { OpenPosition } from '../../models/position';
import { PositionData } from '../../models/position-data';
import { StageType } from 'src/app/modules/position-pipelines/models/pipeline-stage';
import { MatDialog } from '@angular/material/dialog';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';

@Component({
  selector: 'app-position-apply-form',
  templateUrl: './position-apply-form.component.html',
  styleUrl: './position-apply-form.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionApplyFormComponent implements OnInit {

  @Input()
  positionData!: PositionData;

  @Input()
  position!: OpenPosition | undefined;

  @Output()
  applicationSubmitted = new EventEmitter<void>();

  @ViewChild('applyForm', { static: true }) rootElementRef!: ElementRef;

  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;

  public capchaKey = environment.RECAPTCHA_KEY_V2;
  public candidateInfoData: CandidateInfoData = new CandidateInfoData();
  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf'];
  public gdprConfirmationStatus: boolean = false;
  public isJustSent: boolean = false;
  public isApplied: boolean = false;
  public gdprContent: GdprPolicyModel = new GdprPolicyModel();

  public fileCVName = '';
  public fileCLName = '';

  fileCVData!: FileData | undefined;
  fileCLData!: FileData | undefined;
  candiateInfo: any;
  step = 1;
  talentId: string = '';
  positionId: string = '';
  positionPipelineId: any;
  recruiterId: string = '';
  pipelineStages: any[] = []; 
  sourcedStageId: string = '';
  sourcedStageName: string = '';
  sourcedStageStatus = StageStatus.passed;
  sourcedAssessmentScore = 10;
  appliedStageId: string = '';
  appliedStageName: string = '';
  appliedStageStatus = StageStatus.pending;
  appliedAssessmentScore = 1;

  steps: StepData[] = [
    { label: 'CV', icon: 'description', stepNumber: 1 },
    { label: 'Cover Letter', icon: 'chat', stepNumber: 2 },
    { label: 'Personal Info', icon: 'person', stepNumber: 3 },
  ];

  public get isSelectedCv(): boolean {
    return this.fileCVName != undefined && this.fileCVName != null;
  }

  public get selectedCVFileName() {
    return this.fileCVName == '' || this.fileCVName == undefined ? this.content.txtSelectCVPlaceholder : this.fileCVName;
  }

  public set selectedCVFileName(value) {
    this.fileCVName = value;
  }

  public get selectedCLFileName() {
    return this.fileCLName == '' || this.fileCLName == undefined ? this.content.txtSelectCoverLetterPlaceholder : this.fileCLName;
  }

  public set selectedCLFileName(value) {
    this.fileCLName = value;
  }

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  get nativeElement() {
    return this.rootElementRef.nativeElement;
  }

  public candidateForm: FormGroup<CandidateInfoForm> = new FormGroup<CandidateInfoForm>({
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required, Validators.pattern(this.phoneRegx)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
    recaptcha: new FormControl('', [Validators.required]),
    coverLetterText: new FormControl(''),
  });

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    public dialog: MatDialog,
    public content: ContentService,
    private gdprService: GdprService,
    public httpService: HttpService,
    public mainAuthService: AuthService,
    private pipelineService: PositionPipelineService,
    private talentPipelineService: TalentPipelineProgressService,
    private infoConverterService: CandidateInfoConverterService,
    public cvsService: CVService,
  ) {  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.positionId = this.position?._id || '';
    this.gdprContent = this.gdprService.getGdprPolicy();
    this.setUser();

    console.log('position?._id', this.positionId);
  }

  setUser() {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    if (userId) {
      const idToken = sessionStorage.getItem(`${environment.storage.prefixToken}${userId}`);
      if (idToken) {
        const user = this.mainAuthService.decodeJWTToken(idToken).user;
        console.log('user', user);
        this.candidateInfoData.firstname = user.firstname || '';
        this.candidateInfoData.lastname = user.lastname || '';
        this.candidateInfoData.email = user.email || '';
        this.candidateInfoData.phone = user.phone || '';
        this.talentId = user._id || '';
      }
    }
  }

  async getPipelineStagesForPosition() {
    if (!this.position?._id) {
      return;
    }

    try {
      const data: PositionPipeline = await firstValueFrom(
        this.pipelineService.getPipelineByPositionId(this.positionId, true)
      );

      console.log('Pipeline loaded:', data);

      if (data !== null) {

        this.pipelineStages = data.stages.sort(
          (a: { order: number }, b: { order: number }) =>
            a.order - b.order
        );

        const sourcedStage = this.pipelineStages.find(
          (stage: any) => stage.name === STAGES_NAMES.SOURCED
        );

        this.sourcedStageId = sourcedStage ? sourcedStage._id : '';
        this.sourcedStageName = sourcedStage ? sourcedStage.name : '';

        const appliedStage = this.pipelineStages.find(
          (stage: any) => stage.name === STAGES_NAMES.APPLIED
        );

        this.appliedStageId = appliedStage ? appliedStage._id : '';
        this.appliedStageName = appliedStage ? appliedStage.name : '';

        this.positionPipelineId = data._id;
        this.recruiterId = data.userId;

      } else {
        console.warn('No pipeline for position');
      }

      this.changeDetectorRef.markForCheck();

    } catch (err) {
      console.error('Error loading pipeline', err);
      this.changeDetectorRef.markForCheck();
    }
  }

  onGdprConfirmationChanged($event: boolean) {
    this.gdprConfirmationStatus = $event;
  }

  onCVSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {

        this.fileCVData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };

        this.nextStep()
      };

      this.fileCVName = inputNode.files[0].name;
      reader.readAsText(inputNode.files[0]);
    }
  }

  onCLSelected(event: any) {
    const inputNode: any = event.srcElement;

    if (typeof (FileReader) !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {

        this.fileCLData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name
        };

      };

      this.fileCLName = inputNode.files[0].name;
      reader.readAsText(inputNode.files[0]);
    }
  }

  deleteCLFile() {
    this.fileCLData = undefined
    this.fileCLName = '';
    this.changeDetectorRef.detectChanges();
  }

  deleteCVFile() {
    this.fileCVData = undefined
    this.fileCVName = '';
    this.changeDetectorRef.detectChanges();
  }

  async onApply() {
    console.log('candidateInfoData', this.candidateInfoData, this.fileCVData?.fileInfo, this.candidateForm.valid);
    console.log('position?._id', this.position?._id);

    if (this.positionId !== '' && this.talentId !== '') {
      await this.getPipelineStagesForPosition();
    }

    if (!this.candidateForm.errors || this.candidateForm.valid) {

      try {

        if (
          !this.fileCVData?.fileInfo ||
          !this.positionData.position?._id ||
          this.positionData.position?._id === ''
        ) {
          return;
        }

        const infoCVEnvelope = this.infoConverterService.getInfoFullEnvelope(
          this.fileCVData,
          this.candidateInfoData.coverLetterText,
          this.fileCLData ? [this.fileCLData] : [],
          this.positionData.position._id
        );

        console.log('infoCVEnvelope', infoCVEnvelope);

        infoCVEnvelope.candidateInfo = this.candidateInfoData;
        infoCVEnvelope.positionId = this.positionData.position._id;
        infoCVEnvelope.gdprConfirmed = this.gdprConfirmationStatus;

        const userId = sessionStorage.getItem(`${environment.storage.userId}`);

        if (userId) {
          infoCVEnvelope.userId = userId;
        }

        this.isApplied = true;

        const result = await firstValueFrom(
          this.cvsService.uploadOld(this.fileCVData, infoCVEnvelope, [])
        );

        console.log('CV uploaded', result);

        await this.createTalentPipelineSourcedStage();
        await this.createTalentPipelineAppliedStage();

        this.dialog.open(NotificationWindowComponent, {
          data: {
            message: 'Your application has been submitted successfully!'
          }
        });

        this.applicationSubmitted.emit();

        this.isJustSent = true;

        setTimeout(() => {
          this.isJustSent = false;
          this.isApplied = false;
          this.candidateForm.reset();
          this.changeDetectorRef.markForCheck();
        }, 7000);

      } catch (ex) {

        console.error('upload all', ex);

        this.isApplied = false;

        this.dialog.open(WarningsErrorsDialogComponent, {
          data: {
            message: 'Error while submitting your application. Please try again.'
          }
        });

        this.changeDetectorRef.markForCheck();
      }
    }
  }

  async createTalentPipelineSourcedStage(): Promise<void> {
    const talentPipelineSourced: TalentPipelineProgress = new TalentPipelineProgress();

    talentPipelineSourced.userId = this.recruiterId;
    talentPipelineSourced.positionId = this.position?._id;
    // talentPipelineSourced.positionName = this.positionData?.positionTitle;
    talentPipelineSourced.positionPipelineId = this.positionPipelineId;
    talentPipelineSourced.talentId = this.talentId;
    talentPipelineSourced.talentName = this.candidateInfoData.firstname?.trimEnd();
    talentPipelineSourced.stageId = this.sourcedStageId;
    talentPipelineSourced.stageType = StageType.DEFAULT;
    talentPipelineSourced.stageName = this.sourcedStageName;
    talentPipelineSourced.status = this.sourcedStageStatus;
    talentPipelineSourced.assessmentScore = this.sourcedAssessmentScore;

    console.log('TalentPipeline SOURCED to create', talentPipelineSourced);

    try {

      const data = await firstValueFrom(
        this.talentPipelineService.createAsync(
          talentPipelineSourced,
          true,
          false
        )
      );

      console.log('TalentPipeline created:', data);
      this.changeDetectorRef.markForCheck();

    } catch (err) {

      console.error('Error creating TalentPipeline', err);
      this.changeDetectorRef.markForCheck();

      throw err;
    }
  }

  async createTalentPipelineAppliedStage(): Promise<void> {

    const talentPipelineApplied: TalentPipelineProgress = new TalentPipelineProgress();

    talentPipelineApplied.userId = this.recruiterId;
    talentPipelineApplied.positionId = this.position?._id;
    // talentPipelineApplied.positionName = this.positionData?.positionTitle;
    talentPipelineApplied.positionPipelineId = this.positionPipelineId;
    talentPipelineApplied.talentId = this.talentId;
    talentPipelineApplied.talentName = this.candidateInfoData?.firstname?.trimEnd();
    talentPipelineApplied.stageId = this.appliedStageId;
    talentPipelineApplied.stageType = StageType.CV_REVIEW;
    talentPipelineApplied.stageName = this.appliedStageName;
    talentPipelineApplied.status = this.appliedStageStatus;
    talentPipelineApplied.assessmentScore = this.appliedAssessmentScore;

    console.log('TalentPipeline APPLIED to create', talentPipelineApplied);

    try {

      const data = await firstValueFrom(
        this.talentPipelineService.createAsync(
          talentPipelineApplied,
          true,
          false
        )
      );

      console.log('TalentPipeline created:', data);
      this.changeDetectorRef.markForCheck();

    } catch (err) {

      console.error('Error creating TalentPipeline', err);
      this.changeDetectorRef.markForCheck();

      throw err;
    }
  }

  openPrivacyPolicy() {
    this.dialogHelper.openDialog(
      GdprPolicyConfirmationFormComponent, (status: boolean) => {
        if (status) {
          this.gdprConfirmationStatus = status;
        }
        this.changeDetectorRef.markForCheck();
      }, {
      data: this.gdprConfirmationStatus,
      panelClass: "general-panel-class-dialog", isFullScreen: true
    });
  }

  nextStep() {
    if (this.step < 3) this.step++;
  }

  previousStep() {
    if (this.step > 1) this.step--;
  }
  
  getTrackLineWidth(): number {
    if (this.steps.length <= 1) {
      return 0;
    }
    return ((this.step - 1) / (this.steps.length - 1)) * 100;
  }
}

interface StepData {
  label: string;
  icon: string;
  stepNumber: number;
}