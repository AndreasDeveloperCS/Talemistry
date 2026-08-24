import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CvDataInternalEnvelope, InfoCV } from '../../models/cv-item';
import { CandidateInfoConverterService } from '../../services/candidate-info-converter.service';
import { CVService } from '../../services/cv.service';
import { CoverLetterService } from '../../services/cover-letter.service';
import { Subject, take, takeUntil } from 'rxjs';
import { FileData } from '../../../general/models/file-data';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { AddCvDialogComponent } from '../../../positions/components/add-cv-dialog/add-cv-dialog.component';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { IntensityLevel, LanguageSkillType, ManagerialLevel, ProficiencyLevel, SkillType, UserHardSkill } from 'src/app/modules/skills/models/skill';
import { CandidateUserProfile } from '../../models/candidate-user-profile';

@Component({
  selector: 'app-import-cv',
  templateUrl: './import-cv.component.html',
  styleUrl: './import-cv.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportCvComponent implements OnInit, OnDestroy {
  @Input()
  buttonCaption!: string;

  @Input()
  placeholderInputSelectAttachments!: string;

  public inputFileTypes = ['.doc', '.docx', '.rtf', '.pdf'];
  public fileName = '';

  protected _onDestroy = new Subject<void>();
  private selectedFile!: File;
  mainCV!: InfoCV;
  isSelectedCv: boolean = false;
  fileData!: FileData;
  clFileData!: FileData[];
  userId: string | undefined;

  public get selectedFileName() {
    return this.fileName == '' || this.fileName == undefined ? this.placeholderInputSelectAttachments : this.fileName;
  }

  public set selectedFileName(value) {
    this.fileName = value;
  }

  public get extensions() {
    return `${this.inputFileTypes}`;
  }

  constructor(
    public cvService: CVService,
    public coverLetterService: CoverLetterService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private talentProfileService: CandidateUserProfileService,
    private dialogHelperService: DialogHelperService,
    private infoConverterService: CandidateInfoConverterService
  ) { }

  ngOnInit(): void {
    this.cvService.isMainEmmitter
      .pipe(takeUntil(this._onDestroy))
      .subscribe((mainCV: InfoCV) => {
        this.mainCV = mainCV;
        this.selectedFileName = this.mainCV?.originalName ?? '';
        this.cdr.markForCheck();
      })
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
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

        const callbackLong = async (cvData: CvDataInternalEnvelope) => {
          console.log('cv data callbackLong', cvData);
          if(cvData && cvData.coverLetterFileData) {
            this.clFileData = cvData.coverLetterFileData;
          }

          if (cvData && cvData.cvFileData) {
            this.fileName = cvData.cvFileData.fileName ?? inputNode.files[0].name;
            this.selectedFile = cvData.cvFileData.file ?? node.target.result;
            if (cvData.cvFileChanged && cvData.coverLetterFileData) {
              cvData.info.cvFileInfo = this.infoConverterService.convertFileInfo(cvData.cvFileData);
            }
            if (cvData.coverLetterFileChanged && cvData.coverLetterFileData.length > 0) {
              cvData.coverLetterFileData.forEach((fileData: FileData) => {
                cvData.info.coverLetterFileInfo.push(this.infoConverterService.convertFileInfo(fileData));
              });
            }

            this.coverLetterService.coverLetterModel.coverLetterText = cvData.info.coverLetterText;
            if (this.coverLetterService.coverLetterModel) {
              this.coverLetterService.coverLetterModel.candidateInfo.coverLetterText = cvData.info.coverLetterText;
            }

            cvData.info.candidateInfo.coverLetterText = cvData.info.coverLetterText;
            console.log('Before uploading CV', cvData);
            this.cvService
              .upload(cvData.cvFileData ?? this.fileData, cvData.info, cvData.coverLetterFileData)
              .pipe(take(1))
              .subscribe({
                next: (res: any) => {
                  console.log('Upload CV result:', res);
                  this.parseCV(res.obj);
                  
                },
                error: (err: any) => {
                  console.error('Upload failed:', err);
                },
                complete: () => {
                  console.log('Upload completed');
                }
              });
              this.cdr.markForCheck();
          }
        }

        const cvDataEnvelope: CvDataInternalEnvelope = {
          cvFileData: this.fileData,
          info: this.infoConverterService.getInfoFullEnvelope(this.fileData, this.coverLetterService.coverLetterModel.coverLetterText, this.clFileData),
          cvFileChanged: false,
          coverLetterFileChanged: false,
          coverLetterFileData: []
        }
        console.log('cvDataEnvelope callbackLong', cvDataEnvelope);
        this.cdr.markForCheck();
        this.dialogHelperService.openDialog(AddCvDialogComponent, callbackLong, { data: cvDataEnvelope });
      };

      this.isSelectedCv = this.fileName != undefined && this.fileName != null;
      reader.readAsText(inputNode.files[0]);
    }
  }

  parseCV(info: any) {
    if (info) {
      const hardSkills = info.hardSkills || [];
      const softSkills = info.softSkills || [];
      const managerialSkills = info.managerialSkills || [];
      const domainSkills = info.domainSkills || [];
      const languages = info.languagesSkills || [];

      console.log('Received Hard Skills:', hardSkills);
      console.log('Received Soft Skills:', softSkills);
      console.log('Received Managerial Skills:', managerialSkills);
      console.log('Received Domain Skills:', domainSkills);
      console.log('Received Language Skills:', languages);

      // Add Hard Skills
      hardSkills.forEach((skillName: string) => {
        const exists = this.talentProfileService.model.hardSkills.some(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          this.talentProfileService.model.hardSkills.push({
            skillName,
            skillType: SkillType.hard,
            expirienceInMonths: 0,
            expirienceInYears: 0,
            isVerified: false,
            proficiencyEstimation: ProficiencyLevel.Beginner,
            startMonth: new Date(),
            subGroups: [],
          });
        }
      });

      // Add Soft Skills
      softSkills.forEach((skillName: string) => {
        const exists = this.talentProfileService.model.softSkills.some(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          this.talentProfileService.model.softSkills.push({
            skillName,
            skillType: SkillType.soft,
            intensityEstimation: IntensityLevel.Normal,
            isVerified: false,
          });
        }
      });

      managerialSkills.forEach((skillName: string) => {
        const exists = this.talentProfileService.model.managerialSkills.some(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          this.talentProfileService.model.managerialSkills.push({
            skillName,
            skillType: SkillType.managirial,
            level: ManagerialLevel.Project,
            isVerified: false,
          });
        }
      });

      domainSkills.forEach((skillName: string) => {
        const exists = this.talentProfileService.model.domainSkills.some(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          this.talentProfileService.model.domainSkills.push({
            skillName,
            skillType: SkillType.domain,
            isVerified: false,
            proficiencyEstimation: 2,
            expirienceInMonths: 1,
            expirienceInYears: 0
          });
        }
      });

      languages.forEach((skillName: string) => {
        const exists = this.talentProfileService.model.languagesSkills.some(
          (s: any) => s.skillName.toLowerCase() === skillName.toLowerCase()
        );
        if (!exists) {
          this.talentProfileService.model.languagesSkills.push({
            skillName,
            isVerified: false,
            languageSkillType: LanguageSkillType.general,
            skillType: SkillType.language,
            proficiencyEstimation: 2,
            expirienceInMonths: 1,
            expirienceInYears: 0
          });
        }
      });

      console.log('Updated Hard Skills:', this.talentProfileService.model.hardSkills);
      console.log('Updated Soft Skills:', this.talentProfileService.model.softSkills);
      console.log('Updated Managerial Skills:', this.talentProfileService.model.managerialSkills);
      console.log('Updated Domain Skills:', this.talentProfileService.model.domainSkills);
      console.log('Updated Language Skills:', this.talentProfileService.model.languagesSkills);
    }
  }
}
