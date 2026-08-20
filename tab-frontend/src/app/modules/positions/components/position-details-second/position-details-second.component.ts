import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ContentService } from '../../../general/services/content.service';
import { PositionCertification } from '../../models/position-certification';
import { PositionDetails, PositionSkill } from '../../models/position-details';
import { PositionsService } from '../../services/positions.service';
import { PositionEducation } from '../../models/position-education';
import { AcademicEducationLevelType, ProficiencyLevel, SkillType } from '../../../skills/models/skill';

@Component({
  selector: 'app-position-details-second',
  templateUrl: './position-details-second.component.html',
  styleUrl: './position-details-second.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsSecondComponent implements OnInit, OnDestroy {
  @Input()
  positionDetails: PositionDetails = new PositionDetails();

  @Output() 
  formStatusChange = new EventEmitter<boolean>();

  protected _onDestroy = new Subject<void>();
  public SkillType = SkillType;
  public ProficiencyLevel = ProficiencyLevel;
  public positionRequirementsForm: FormGroup;
  public additionalInfoForm: FormGroup;

  proficiencyLevels: ProficiencyLevel[] = [];
  requiredEducation: AcademicEducationLevelType[] = [];
  requiredCertification: PositionCertification[] = [];
  isRequiredEducation: boolean = true;
  isRequiredCertification: boolean = true;
  skillsList: PositionSkill[] = [];
  educationList: PositionEducation[] = [];
  isEducationRequired: boolean = true;
  isCertificateRequired: boolean = true;
  certificationList: PositionCertification[] = [];

  constructor(
    public positionsService: PositionsService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {

    this.positionRequirementsForm = this.formBuilder.group({
      proficiencyLevel: [this.positionsService.model.positionDetails.requirements.proficiencyLevel || '', 
        [Validators.required]],
    });
    this.additionalInfoForm = this.formBuilder.group({
      additionalInfo: [this.positionsService.model.positionDetails.additionalInfo || '']
    });

    this.positionRequirementsForm.statusChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.emitFormStatus();
        this.cdr.markForCheck();
      });

    this.additionalInfoForm.statusChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.emitFormStatus();
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.proficiencyLevels = Object.values(ProficiencyLevel);
    this.positionRequirementsForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        requirements: {
          proficiencyLevel: value.proficiencyLevel,
          requiredEducation: this.positionsService.model.positionDetails.requirements.requiredEducation,
          isRequiredEducation: this.positionsService.model.positionDetails.requirements.isRequiredEducation,
          isRequiredCertification: this.positionsService.model.positionDetails.requirements.isRequiredEducation,
          requiredCertification: this.positionsService.model.positionDetails.requirements.requiredCertification,
          positionSkills: this.positionsService.model.positionDetails.requirements.positionSkills
        },
      };

      this.positionsService.notifyUpdate();

      this.positionsService.updateForm({
        positionDetails: {
          requirements: {
            proficiencyLevel: value.proficiencyLevel,
            requiredEducation: this.positionsService.model.positionDetails.requirements.requiredEducation,
            isRequiredEducation: this.positionsService.model.positionDetails.requirements.isRequiredEducation,
            isRequiredCertification: this.positionsService.model.positionDetails.requirements.isRequiredCertification,
            requiredCertification: this.positionsService.model.positionDetails.requirements.requiredCertification,
            positionSkills: this.positionsService.model.positionDetails.requirements.positionSkills
          }
        }
      });
      this.cdr.markForCheck();
      console.log('Proficiency Level', this.positionsService.model.positionDetails.requirements.proficiencyLevel);
    });

    this.additionalInfoForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        additionalInfo: value.additionalInfo
      };

      this.positionsService.notifyUpdate();
      this.cdr.markForCheck();
    });

    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.skillsList = this.positionsService.model.positionDetails.requirements.positionSkills;
        this.educationList = this.positionsService.model.positionDetails.requirements.requiredEducation;
        this.isEducationRequired = this.positionsService.model.positionDetails.requirements.isRequiredEducation;
        this.certificationList = this.positionsService.model.positionDetails.requirements.requiredCertification;
        this.isCertificateRequired = this.positionsService.model.positionDetails.requirements.isRequiredCertification;
        this.emitFormStatus();
        this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const isValid = this.positionRequirementsForm.valid 
      && this.additionalInfoForm.valid
      && this.skillsList?.length > 0
      && (!this.isCertificateRequired || this.certificationList?.length > 0)
      && (!this.isEducationRequired || this.educationList?.length > 0);
    console.log('Skills', this.skillsList?.length > 0);
    console.log('Certification', !this.isCertificateRequired || this.certificationList?.length > 0);
    console.log('Education', !this.isEducationRequired || this.educationList?.length > 0);
    console.log('Second', isValid);
    this.formStatusChange.emit(isValid);
  }
}