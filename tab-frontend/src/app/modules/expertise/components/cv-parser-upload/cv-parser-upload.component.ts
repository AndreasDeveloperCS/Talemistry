import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Subject, take, takeUntil } from 'rxjs';
import { GdprPolicyConfirmationFormComponent } from 'src/app/modules/general/components/gdpr-policy-confirmation-form/gdpr-policy-confirmation-form.component';
import { FileData } from 'src/app/modules/general/models/file-data';
import { GdprPolicyModel } from 'src/app/modules/general/models/gdpr-model';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { GdprService } from 'src/app/modules/general/services/gdpr.service';
import { UserProfileService } from 'src/app/modules/profiles/user-profile/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { CandidateInfoData } from '../../models/candidate-info';
import { CvDataInternalEnvelope, InfoCV } from '../../models/cv-item';
import { FileInfo } from '../../models/file-info';
import { CandidateInfoConverterService } from '../../services/candidate-info-converter.service';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { CoverLetterService } from '../../services/cover-letter.service';
import { CVService } from '../../services/cv.service';
import { AcademicEducationLevelType, EducationInstitution, IntensityLevel, LanguageSkillType, ManagerialLevel, ProficiencyLevel, Skill, SkillType, UserAcademicEducation, UserCertification, UserDomainSkill, UserHardSkill, UserLanguageSkill, UserManagerialSkill, UserOperationalExpirience, UserSoftSkill } from 'src/app/modules/skills/models/skill';
import { CandidateUserProfile } from '../../models/candidate-user-profile';
import { CVParserGateway } from '../../gateways/cv-parser.gateway';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { MatDialog } from '@angular/material/dialog';

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

type SkillsField =
  | 'hardSkills'
  | 'softSkills'
  | 'managerialSkills'
  | 'domainSkills'
  | 'languagesSkills';

interface ProcessingStep {
  id: number;
  label: string;
  sublabel: string;
}

@Component({
  selector: 'app-cv-parser-upload',
  templateUrl: './cv-parser-upload.component.html',
  styleUrl: './cv-parser-upload.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CvParserUploadComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();  
  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf'];
  public gdprConfirmationStatus: boolean = false;
  public gdprContent: GdprPolicyModel = new GdprPolicyModel();
  public talentProfileData: CandidateUserProfile | null = new CandidateUserProfile();
  state: UploadState = 'idle';
  currentStep = 0;
  cvFile: File | null = null;
  coverLetter: File | null = null;
  isDragging = false;
  mainCV!: InfoCV;
  data: CvDataInternalEnvelope = {
  cvFileChanged: false,
  coverLetterFileChanged: false,

  info: {
    userId: null,

    candidateInfo: {
      firstname: '',
      lastname: '',
      email: '',
      phone: ''
    } as CandidateInfoData,

    gdprConfirmed: false,

    withCoverLetter: false,
    withCoverLetterAttachment: false,

    cvFileInfo: {} as FileInfo,
    coverLetterFileInfo: [],

    coverLetterText: ''
  },

  cvFileData: {} as FileData,
  coverLetterFileData: []
};

  private processingTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly processingSteps: ProcessingStep[] = [
    { id: 1, label: 'Uploading', sublabel: 'Saving your file securely' },
    { id: 2, label: 'Processing', sublabel: 'Extracting text from document' },
    { id: 3, label: 'AI Parsing', sublabel: 'Analyzing CV with AI' },
    { id: 4, label: 'Finalizing', sublabel: 'Finalizing the result' }
  ];

  skillsSections: {
    label: string;
    field: SkillsField;
    icon: string;
  }[] = [
    {
      label: 'Hard Skills',
      field: 'hardSkills',
      icon: 'auto_awesome'
    },
    {
      label: 'Soft Skills',
      field: 'softSkills',
      icon: 'psychology'
    },
    {
      label: 'Managerial Skills',
      field: 'managerialSkills',
      icon: 'manage_accounts'
    },
    {
      label: 'Domain Skills',
      field: 'domainSkills',
      icon: 'domain'
    },
    {
      label: 'Languages',
      field: 'languagesSkills',
      icon: 'language'
    }
  ];

  editingSections: Record<string, boolean> = {};

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  constructor(
    public cvService: CVService,
    public coverLetterService: CoverLetterService,
    private cvParserGateway: CVParserGateway,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    public dialog: MatDialog,
    private talentProfileService: CandidateUserProfileService,
    private infoConverterService: CandidateInfoConverterService,
    private userProfileService: UserProfileService,
    private gdprService: GdprService,
  ) { }

  ngOnInit(): void {
    const userId = sessionStorage.getItem(`${environment.storage.userId}`);
    this.userProfileService.getByIdAsync(userId, true)
    .pipe(take(1))
    .subscribe(user => {
      if (user) {
        this.data.info.candidateInfo.firstname = user.firstname;
        this.data.info.candidateInfo.lastname = user.lastname;
        this.data.info.candidateInfo.email = user.email;
        this.data.info.candidateInfo.phone = user.phone;
      }
    });

    this.gdprContent = this.gdprService.getGdprPolicy();
    //
    //this.talentProfileData = structuredClone(this.talentProfileService.model);
  }

  ngOnDestroy(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  toggleEdit(sectionKey: string) {
    this.editingSections[sectionKey] = !this.editingSections[sectionKey];
  }

  removeSkill(field: keyof CandidateUserProfile, index: number) {
    this.getSkills(field).splice(index, 1);
  }

  removeItem(field: keyof CandidateUserProfile, index: number) {
    if(this.talentProfileData) {
      (this.talentProfileData[field] as any[]).splice(index, 1);
    }
  }

  addSkill(field: keyof CandidateUserProfile) {
    this.getSkills(field).push(new Skill());
  }

  addExperience() {
    if(this.talentProfileData) {
      this.talentProfileData.operationalExperience.push(new UserOperationalExpirience());
    }
  }

  addEducation() {
    if(this.talentProfileData) {
      this.talentProfileData.academicEducation.push(new UserAcademicEducation());
    }
  }

  addCertification() {
    if(this.talentProfileData) {
      this.talentProfileData.certification.push(new UserCertification());
    }
  }

  saveSkills(field: keyof CandidateUserProfile) {
    const updated = this.getSkills(field);
    this.toggleEdit(field);
    console.log('Model', this.talentProfileData);
  }

  saveSection(field: keyof CandidateUserProfile) {
    this.toggleEdit(field);
    console.log('Updated:', this.talentProfileData);
  }

  setStep(step: number) {
    this.currentStep = step - 1;
    this.state = 'processing';
    this.cdr.markForCheck();
  }

  getSkills(field: keyof CandidateUserProfile) {
    return this.talentProfileData?.[field] ?? [];
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidFileType(file)) {
        this.cvFile = file;
      }
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    console.log('File:', file);
    this.cvFile = file;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!this.data) {
        return;
      }

      this.data.cvFileData = {
        file: file,
        fileInfo: file,
        fileName: file.name
      };

      this.data.cvFileChanged = true;

      console.log('CV file selected:', this.data.cvFileData);
    };

    reader.readAsText(file);

    input.value = '';
  }

  onCoverLetterSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.coverLetter = file;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileData = {
        file: file,
        fileInfo: file,
        fileName: file.name
      };

      if (!this.data.coverLetterFileData) {
        this.data.coverLetterFileData = [];
      }

      this.data.coverLetterFileData.length = 0;
      this.data.coverLetterFileData.push(fileData);

      this.data.coverLetterFileChanged = true;

      console.log('CL file selected:', this.data.coverLetterFileData);
    };

    reader.readAsText(file);

    input.value = '';
  }

  removeCvFile(event: Event): void {
    console.log('Remove file');
    event.stopPropagation();
    this.cvFile = null;
  }

  removeCoverLetter(event: Event): void {
    event.stopPropagation();
    this.coverLetter = null;
  }

  async handleUpload() {
    console.log('Data', this.data);
    this._onDestroy.next();
    this.resetUpload();
    if (this.data && this.data.cvFileData) {
      if (this.data.cvFileChanged && this.data.coverLetterFileData) {
        this.data.info.cvFileInfo = this.infoConverterService.convertFileInfo(this.data.cvFileData);
      }
      if (this.data.coverLetterFileChanged && this.data.coverLetterFileData.length > 0) {
        this.data.coverLetterFileData.forEach((fileData: FileData) => {
          this.data.info.coverLetterFileInfo.push(this.infoConverterService.convertFileInfo(fileData));
        });
      }

      this.coverLetterService.coverLetterModel.coverLetterText = this.data.info.coverLetterText;
      if (this.coverLetterService.coverLetterModel) {
        this.coverLetterService.coverLetterModel.candidateInfo.coverLetterText = this.data.info.coverLetterText;
      }

      this.data.info.candidateInfo.coverLetterText = this.data.info.coverLetterText;
      this.data.info.withCoverLetterAttachment = this.data.coverLetterFileData.length > 0;
      console.log('Before uploading CV', this.data);

      this.state = 'processing';

      this.cvParserGateway.connect();
      this.subscribeToSocket();

      this.cvService
      .upload(this.data.cvFileData, this.data.info, this.data.coverLetterFileData)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          console.log('Upload CV result:', res);

          if (res.success && res.cvId) {
            this.cvParserGateway.joinRoom(res.cvId);
          } else {
            this.simulateError();
          }
        },
        error: (err: any) => {
          console.error('Upload failed:', err);
          this.simulateError();
        }
      });
      this.cdr.markForCheck();
    }
    this.cdr.markForCheck();
  }

  private subscribeToSocket() {
    this.cvParserGateway.onUploaded().pipe(takeUntil(this._onDestroy), distinctUntilChanged()).subscribe(() => {
      console.log('CV Parser Gateway UPLOADED');
      this.setStep(1);
    });

    this.cvParserGateway.onParsing().pipe(takeUntil(this._onDestroy), distinctUntilChanged()).subscribe(() => {
      console.log('CV Parser Gateway PARSING');
      this.setStep(2);
    });

    this.cvParserGateway.onAiProcessing().pipe(takeUntil(this._onDestroy), distinctUntilChanged()).subscribe(() => {
      console.log('CV Parser Gateway AI PROCESSING');
      this.setStep(3);
    });

    this.cvParserGateway.onFinalizing().pipe(takeUntil(this._onDestroy), distinctUntilChanged()).subscribe(() => {
      console.log('CV Parser Gateway FINALIZING');
      this.setStep(4);
    });

    this.cvParserGateway.onParsedCV().pipe(takeUntil(this._onDestroy), distinctUntilChanged()).subscribe(data => {
      console.log('CV Parser Gateway PARSED CV', data);
      //this.talentProfileData = structuredClone(this.talentProfileService.model);
      this.talentProfileData = data;
      this.state = 'success';
      this.cdr.markForCheck();
    });
  }

  simulateError(): void {
    this.state = 'error';
  }

  retryUpload(): void {
    this.state = 'idle';
    //this.simulateProcessing();
  }

  saveToProfile() {
    if(!this.talentProfileData) {
      return;
    }
    const hardSkills = this.talentProfileData?.hardSkills || [];
    const softSkills = this.talentProfileData?.softSkills || [];
    const managerialSkills = this.talentProfileData?.managerialSkills || [];
    const domainSkills = this.talentProfileData?.domainSkills || [];
    const languages = this.talentProfileData?.languagesSkills || [];
    const experience = this.talentProfileData?.operationalExperience || [];
    const education = this.talentProfileData?.academicEducation || [];
    const certification = this.talentProfileData?.certification || [];

    console.log('Received talent profile:', this.talentProfileData);

    hardSkills.forEach((skill: UserHardSkill) => {
      const exists = this.talentProfileService.model.hardSkills.some(
        (s: any) => s.skillName.toLowerCase() === skill.skillName.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.hardSkills.push({
          skillName: skill?.skillName,
          skillType: SkillType.hard,
          expirienceInMonths: skill?.expirienceInMonths ?? 0,
          expirienceInYears: skill?.expirienceInYears ?? 0,
          isVerified: skill?.isVerified ?? false,
          proficiencyEstimation: skill?.proficiencyEstimation ?? ProficiencyLevel.Beginner,
          startMonth: skill?.startMonth ?? new Date(),
          subGroups: skill?.subGroups ?? [],
        });
      }
    });

    softSkills.forEach((skill: UserSoftSkill) => {
      const exists = this.talentProfileService.model.softSkills.some(
        (s: any) => s.skillName.toLowerCase() === skill.skillName.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.softSkills.push({
          skillName: skill?.skillName,
          skillType: SkillType.soft,
          intensityEstimation: skill?.intensityEstimation ?? IntensityLevel.Normal,
          isVerified: skill?.isVerified ?? false,
        });
      }
    });

    managerialSkills.forEach((skill: UserManagerialSkill) => {
      const exists = this.talentProfileService.model.managerialSkills.some(
        (s: any) => s.skillName.toLowerCase() === skill.skillName.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.managerialSkills.push({
          skillName: skill?.skillName,
          skillType: SkillType.managirial,
          level: skill?.level ?? ManagerialLevel.Project,
          isVerified: false,
        });
      }
    });

    domainSkills.forEach((skill: UserDomainSkill) => {
      const exists = this.talentProfileService.model.domainSkills.some(
        (s: any) => s.skillName.toLowerCase() === skill.skillName.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.domainSkills.push({
          skillName: skill?.skillName,
          skillType: SkillType.domain,
          isVerified: skill?.isVerified ?? false,
          proficiencyEstimation: skill?.proficiencyEstimation ?? 2,
          expirienceInMonths: skill?.expirienceInMonths ?? 1,
          expirienceInYears: skill?.expirienceInYears ?? 0
        });
      }
    });

    languages.forEach((skill: UserLanguageSkill) => {
      const exists = this.talentProfileService.model.languagesSkills.some(
        (s: any) => s.skillName.toLowerCase() === skill.skillName.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.languagesSkills.push({
          skillName: skill?.skillName,
          isVerified: skill?.isVerified ?? false,
          languageSkillType: skill?.languageSkillType ?? LanguageSkillType.general,
          skillType: SkillType.language,
          proficiencyEstimation: skill?.proficiencyEstimation ?? 2,
          expirienceInMonths: skill?.expirienceInMonths ?? 1,
          expirienceInYears: skill?.expirienceInYears ?? 0
        });
      }
    });

    experience.forEach((exp: UserOperationalExpirience) => {
      if(!exp?.companyName || !exp?.jobTitle) {
        return;
      }
      const exists = this.talentProfileService.model.operationalExperience.some(
        (e: any) => e.companyName.toLowerCase() === exp.companyName.toLowerCase() 
                    && e.jobTitle.toLowerCase() === exp.jobTitle.toLowerCase()
      );
      if (!exists) {
        this.talentProfileService.model.operationalExperience.push({
          skillName: exp?.skillName,
          isVerified: exp?.isVerified ?? false,
          isCurrent: exp?.isCurrent ?? false,
          companyName: exp?.companyName ?? '',
          workExpirienceName: exp?.workExpirienceName ?? '',
          achievements: exp?.achievements ?? [],
          startWorkDate: exp?.startWorkDate ?? new Date(),
          endWorkDate: exp?.endWorkDate ?? new Date(),
          additionalInfo: exp?.additionalInfo ?? '',
          skillType: SkillType.operationalExperience,
          jobTitle: exp?.jobTitle ?? '',
          resposiblities: exp?.resposiblities ?? [],
          skills: exp?.skills ?? []
        });
      }
    });

    education.forEach((edu: UserAcademicEducation) => {
      if(!edu?.institutionName) {
        return;
      }
      const exists = this.talentProfileService.model.academicEducation.some(
        (e: any) => e.institutionName.toLowerCase() === edu.institutionName.toLowerCase() 
                    && e.specialication.toLowerCase() === edu.specialication.toLowerCase()
      );
      if (!exists) {
        const institution = edu?.institution
        ? edu.institution
        : (() => {
            const inst = new EducationInstitution();
            inst.internationalName = edu?.institutionName ?? '';
            return inst;
          })();
        this.talentProfileService.model.academicEducation.push({
          skillName: edu?.skillName,
          institutionName: edu?.institutionName ?? '',
          institution: institution,
          startStudyDate: edu?.startStudyDate ?? new Date(),
          graduationDate: edu?.graduationDate ?? new Date(),
          currentlyStudying: edu?.currentlyStudying ?? false,
          skillType: SkillType.hard,
          academicEducationLevelType: edu?.academicEducationLevelType ?? AcademicEducationLevelType.any,
          specialication: edu?.specialication ?? '',
          isVerified: edu?.isVerified ?? false
        });
      }
    });

    certification.forEach((cert: UserCertification) => {
      if(!cert?.skillName || !cert?.certificationDate) {
        return;
      }
      const exists = this.talentProfileService.model.certification.some(
        (c: any) => c.description.toLowerCase() === cert.description.toLowerCase() 
                  && c.certificationCenter.toLowerCase() === cert.certificationCenter.toLowerCase() 
      );
      if (!exists) {
        this.talentProfileService.model.certification.push({
          skillName: cert?.skillName,
          description: cert?.description ?? '',
          certificateNumber: cert?.certificateNumber ?? '',
          certificationDate: cert?.certificationDate ?? new Date(),
          skillType: SkillType.certification,
          certificationCenter: cert?.certificationCenter ?? '',
          isVerified: cert?.isVerified ?? false
        });
      }
    });

    console.log('Updated Profile before save:', this.talentProfileService.model);

    this.talentProfileService
    .updateAsync(this.talentProfileService.model, true, false)
    .pipe(take(1))
    .subscribe((result: any) => {
      this.dialog.open(NotificationWindowComponent, 
        { data: { message: "Profile has been successfully updated!" } }
      );
      console.log('updated candidate profile model ', result);
    });
    this.cdr.markForCheck();
  }

  resetUpload(): void {
    this.state = 'idle';
    this.cvFile = null;
    this.coverLetter = null;
    this.currentStep = 0;
    this.talentProfileData = null;
  }

  getFileSize(file: File): string {
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB >= 1) {
      return `${sizeMB.toFixed(2)} MB`;
    }
    return `${(file.size / 1024).toFixed(1)} KB`;
  }

  isStepComplete(index: number): boolean {
    return index < this.currentStep;
  }

  isStepCurrent(index: number): boolean {
    return index === this.currentStep;
  }

  private isValidFileType(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return validTypes.includes(file.type);
  }

  onGdprConfirmationChanged($event: boolean | any) {
    this.gdprConfirmationStatus = $event;
    console.log('onGdprConfirmationChanged:', this.gdprConfirmationStatus);
  }

  openPrivacyPolicy() {
    this.dialogHelper.openDialog(
      GdprPolicyConfirmationFormComponent
      , (status: any) => {
        console.log('GDPR confirmation status:', status);

        if (status) {
          this.gdprConfirmationStatus = status;
        }
        this.cdr.markForCheck();
      }, {
      data: this.gdprConfirmationStatus,
      panelClass: "general-panel-class-dialog"
    });
  }

  formatDateForInput(date: Date | string | null): string | null {
    if (!date) {
      return null;
    }

    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  parseDateFromInput(value: string): Date {
    return value ? new Date(value) : new Date();
  }
}
