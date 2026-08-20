import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PositionBenefit } from '../../../position-benefits/models/position-benefit';
import { PositionCertification } from '../../models/position-certification';
import { CompensationTimeline, ContractConditions, ContractType, CooperationType, InvolevementType, JobType, PositionDetails, PositionSkill, SpecificRequirement, WorkPlace } from '../../models/position-details';
import { PositionsService } from '../../services/positions.service';
import { AcademicEducationLevelType, ProficiencyLevel, SkillType } from '../../../skills/models/skill';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';

@Component({
  selector: 'app-position-details-main',
  templateUrl: './position-details-main.component.html',
  styleUrl: './position-details-main.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsMainComponent implements OnInit, OnDestroy {
  @Input()
  positionDetails: PositionDetails = new PositionDetails();

  public SkillType = SkillType;
  public ProficiencyLevel = ProficiencyLevel;
  public generalInfoForm: FormGroup;
  public contractConditionsForm: FormGroup;
  public positionRequirementsForm: FormGroup;
  public additionalInfoForm: FormGroup;
  protected _onDestroy = new Subject<void>();

  contractConditions: ContractConditions = new ContractConditions();
  involevementType: InvolevementType = InvolevementType.outsource;
  involevementTypes: InvolevementType[] = [];
  workPlaces: WorkPlace[] = [];
  specificRequirements: SpecificRequirement[] = [];
  compensationTimelines: CompensationTimeline[] = [];
  contractTypes: ContractType[] = [];
  headquarterLocation: Location[] = [];
  selectedOption: string = '';
  jobType: JobType[] = [];
  proficiencyLevels: ProficiencyLevel[] = [];
  cooperationType: CooperationType[] = [];
  timeline: CompensationTimeline[] = [];
  requiredEducation: AcademicEducationLevelType[] = [];
  requiredCertification: PositionCertification[] = [];
  isRequiredEducation: boolean = true;
  isRequiredCertification: boolean = true;

  options = [
    'Contract Type',
    'Compensation Timeline',
    'Position Budget',
    'Contract Month Duration',
    'Is Indefinite Duration',
  ];

  constructor(
    public positionsService: PositionsService,
    public content: ContentService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    
    this.generalInfoForm = new FormGroup({
      workPlaces: new FormControl(' '),
      headquarterLocation: new FormControl([]),
      specificRequirement: new FormControl([]),
      hiringManagers: new FormControl([]),
    });

    this.contractConditionsForm = new FormGroup({
      cooperationType: new FormControl(),
      jobType: new FormControl(),
      involevementType: new FormControl(),
      maxBudgetAmount: new FormControl(),
      timeline: new FormControl(),
      benefits: new FormControl([])
    });

    this.positionRequirementsForm = new FormGroup({
      ProficiencyLevel: new FormControl(),
      requiredEducation: new FormControl(),
      isRequiredEducation: new FormControl(),
      isRequiredCertification: new FormControl(),
      requiredCertification: new FormControl(),
    });
    this.additionalInfoForm = new FormGroup({
      additionalInfo: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.positionsService.model.positionDetails.requirements.positionSkills = [new PositionSkill()];
    this.involevementTypes = Object.values(InvolevementType);
    this.workPlaces = Object.values(WorkPlace);
    this.specificRequirements = Object.values(SpecificRequirement);
    this.compensationTimelines = Object.values(CompensationTimeline);
    this.contractTypes = Object.values(ContractType);
    this.proficiencyLevels = Object.values(ProficiencyLevel);
    this.headquarterLocation = Object.values(Location);
    this.jobType = Object.values(JobType);
    this.cooperationType = Object.values(CooperationType);
    this.timeline = Object.values(CompensationTimeline);
    this.requiredEducation = Object.values(AcademicEducationLevelType);

    this.onIsRequiredCertificationChange(this.isRequiredCertification);
    this.toggleRequiredEducation(this.isRequiredEducation);

    this.generalInfoForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        general: {
          ...this.positionsService.model.positionDetails.general,
          workPlace: value.workPlaces,
          specificRequirements: value.specificRequirement,
        },
        headquarterLocation: value.headquarterLocation,
        hiringManagers: value.hiringManagers
      };

      this.positionsService.notifyUpdate();
      this.positionsService.updateForm({
        positionDetails: {
          general: {
            workPlaces: value.workPlaces,
            headquarterLocation: value.headquarterLocation,
            specificRequirement: value.specificRequirement,
            hiringManagers: value.hiringManagers
          }
        }
      });
      this.changeDetectorRef.markForCheck();
    });

    this.contractConditionsForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        conditions: {
          cooperationType: value.cooperationType,
          jobType: value.jobType,
          involevementType: value.involevementType,
          isIndefinitedDuration: value.isIndefinitedDuration,
          budget: {
            maxBudgetAmount: value.maxBudgetAmount,
            timeline: value.timeline,
            annualBudget: value.annualBudget,
            calcateAnnualBudget: value.calcateAnnualBudget,
          },
          benefits: value.benefits
        },
      };

      this.positionsService.notifyUpdate();

      this.positionsService.updateForm({
        positionDetails: {
          conditions: {
            cooperationType: value.cooperationType,
            jobType: value.jobType,
            involevementType: value.involevementType,
            maxBudgetAmount: value.maxBudgetAmount,
            timeline: value.timeline,
            benefits: value.benefits
          }
        }
      });
      this.changeDetectorRef.markForCheck();
    });

    this.positionRequirementsForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        requirements: {
          proficiencyLevel: value.ProficiencyLevel,
          requiredEducation: value.requiredEducation,
          isRequiredEducation: value.isRequiredEducation,
          isRequiredCertification: value.isRequiredCertification,
          requiredCertification: value.requiredCertification,
          positionSkills: value.positionSkills
        },
      };

      this.positionsService.notifyUpdate();

      this.positionsService.updateForm({
        positionDetails: {
          requirements: {
            ProficiencyLevel: value.ProficiencyLevel,
            requiredEducation: value.requiredEducation,
            isRequiredEducation: value.isRequiredEducation,
            isRequiredCertification: value.isRequiredCertification,
            requiredCertification: value.requiredCertification
          }
        }
      });
      this.changeDetectorRef.markForCheck();
    });

    this.additionalInfoForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value: any) => {
      this.positionsService.model.positionDetails = {
        ...this.positionsService.model.positionDetails,
        additionalInfo: value.additionalInfo
      };

      this.positionsService.notifyUpdate();
    });
    this.changeDetectorRef.markForCheck();
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onIsRequiredCertificationChange(value: boolean) {
    this.positionRequirementsForm.patchValue({
      isRequiredCertification: value
    });
  }

  onRequiredCertificationChange(certifications: PositionCertification[]) {
    this.positionRequirementsForm.patchValue({
      requiredCertification: certifications
    });
  }

  onBenefitsChange(benefits: PositionBenefit[]) {
    this.contractConditionsForm.patchValue({
      benefits: benefits
    });
  }

  toggleRequiredEducation(value: boolean) {
    this.positionRequirementsForm.patchValue({
      isRequiredEducation: value
    });
    this.positionsService.model.positionDetails.requirements.isRequiredEducation = value;
  }
}
