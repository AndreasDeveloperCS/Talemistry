import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CompanyVersion } from '../../../companies/models/company';
import { ContentService } from '../../../general/services/content.service';
import { Country } from '../../../location/models/country';
import { SkillType } from '../../../skills/models/skill';
import { PositionBenefit } from '../../../position-benefits/models/position-benefit';
import { CompensationTimeline, ContractConditions, ContractType, CooperationType, InvolevementType, JobType, PositionDetails, SpecificRequirement, WorkPlace } from '../../models/position-details';
import { PositionsService } from '../../services/positions.service';

@Component({
  selector: 'app-position-details-first',
  templateUrl: './position-details-first.component.html',
  styleUrl: './position-details-first.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsFirstComponent implements OnInit, OnDestroy {
  @Input()
  positionDetails: PositionDetails = new PositionDetails();
  
  @Output()
  formStatusChange = new EventEmitter<boolean>();

  protected _onDestroy = new Subject<void>();
  public generalInfoForm: FormGroup;
  public contractConditionsForm: FormGroup;
  public SkillType = SkillType;

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
  cooperationType: CooperationType[] = [];
  timeline: CompensationTimeline[] = [];
  locationsList: Country[] = [];
  benefitsList: PositionBenefit[] = [];
  company!: CompanyVersion;
  
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
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {

    this.generalInfoForm = this.formBuilder.group({
      workPlaces: [this.positionsService.model.positionDetails.general.workPlace || '',
      [Validators.required]],
      specificRequirement: [this.positionsService.model.positionDetails.general.specificRequirements || []],
      hiringManagers: [this.positionsService.model.positionDetails.hiringManagers || []],
    });

    this.contractConditionsForm = this.formBuilder.group({
      cooperationType: [this.positionsService.model.positionDetails.conditions.cooperationType || '',
      [Validators.required]],
      jobType: [this.positionsService.model.positionDetails.conditions.jobType || '',
      [Validators.required]],
      involevementType: [this.positionsService.model.positionDetails.conditions.involevementType || '',
      [Validators.required]],
      maxBudgetAmount: [this.positionsService.model.positionDetails.conditions.budget.maxBudgetAmount || '',
      [Validators.required]],
      timeline: [this.positionsService.model.positionDetails.conditions.budget.timeline || '',
      [Validators.required]],
    });

    this.generalInfoForm.statusChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.emitFormStatus();
        this.cdr.markForCheck();
      });

    this.contractConditionsForm.statusChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.emitFormStatus();
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.involevementTypes = Object.values(InvolevementType);
    this.workPlaces = Object.values(WorkPlace);
    this.specificRequirements = Object.values(SpecificRequirement);
    this.compensationTimelines = Object.values(CompensationTimeline);
    this.contractTypes = Object.values(ContractType);
    this.headquarterLocation = Object.values(Location);
    this.jobType = Object.values(JobType);
    this.cooperationType = Object.values(CooperationType);
    this.timeline = Object.values(CompensationTimeline);

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
          headquarterLocation: this.positionsService.model.positionDetails.headquarterLocation,
          hiringManagers: this.positionsService.model.positionDetails.hiringManagers
        };

        this.positionsService.notifyUpdate();

        this.positionsService.updateForm({
          positionDetails: {
            general: {
              workPlaces: value.workPlaces,
              headquarterLocation: this.positionsService.model.positionDetails.headquarterLocation,
              specificRequirement: value.specificRequirement,
              hiringManagers: this.positionsService.model.positionDetails.hiringManagers
            }
          }
        });
        this.cdr.markForCheck();
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
            benefits: this.positionsService.model.positionDetails.conditions.benefits
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
              benefits: this.positionsService.model.positionDetails.conditions.benefits
            }
          }
        });
        this.cdr.markForCheck();
      });

    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.locationsList = this.positionsService.model.positionDetails.headquarterLocation;
        this.benefitsList = this.positionsService.model.positionDetails.conditions.benefits;
        this.company = this.positionsService.model.positionDetails.company;
        this.emitFormStatus();
        this.cdr.markForCheck();
      });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private emitFormStatus() {
    const isValid = this.generalInfoForm.valid
      && this.contractConditionsForm.valid
      && this.benefitsList.length > 0
      && this.locationsList.length > 0
      && this.company.data.companyName !== '';
    console.log('First', isValid);
    this.formStatusChange.emit(isValid);
  }
}