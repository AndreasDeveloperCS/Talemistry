
import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { Guid } from 'guid-typescript';
import { LabelType, Options } from '@angular-slider/ngx-slider';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { HardSkillSubGroup, IntensityLevel, LanguageSkillType, ProficiencyLevel, Skill, SkillType } from '../../../skills/models/skill';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { ContentService } from '../../../general/services/content.service';
import { AcademicEducationSkillForm, CertificateSkillForm, DomainSkillForm, HardSkillForm, LanguageSkillForm, ManagerialSkillForm, OperationalExperienceSkillForm, SoftSkillForm } from '../../../skills/models/skill-form';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrl: './skill.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillComponent implements AfterViewChecked, AfterViewInit, OnDestroy {
  @Input() 
  skill!: any;
  
  @Input() 
  showSlider: boolean = false;

  @Input() 
  readonly: boolean = false;

  @Input() 
  skillType: SkillType = SkillType.other;

  private subscriptions: Subscription = new Subscription();
  protected _onDestroy = new Subject<void>();
  public startDate: Date = new Date();
  public domainsSubGroups: string[] = [];
  public subGroups: string[] = Object.keys(HardSkillSubGroup).filter(key => isNaN(Number(key)));
  public filteredSubGroup: string[] = Object.keys(HardSkillSubGroup).filter(key => isNaN(Number(key)));
  public isOpen: boolean = false;
  
  filteredOptions!: Observable<string[]>;
  errorNotification: string = '';
  skillNames: string[] = [];
  skillForm!: FormGroup;
  SkillType = SkillType;
  skillProficiency: number = 0;
  languageProficiency: number = 0;
  skillLevels: string[] = Object.values(ProficiencyLevel).filter(key => isNaN(Number(key)));
  intensityLevels: string[] = Object.values(IntensityLevel).filter(key => isNaN(Number(key)));
  languageLevels: string[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  skillOptions!: Options;
  languageOptions!: Options;
  languageSkillTypes: LanguageSkillType[] = Object.values(LanguageSkillType).filter(key => isNaN(Number(key)));;
  currentDate: Date = new Date();

  constructor(
    private dialogHelper: DialogHelperService,
    private formBuilder: FormBuilder,
    public service: CandidateUserProfileService,
    public content: ContentService,
    public changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.skillForm = this.createSkillForm(this.skill.skillType);

    this.skillOptions = this.skill.skillType == SkillType.soft
      ? this.createSliderOptions(this.intensityLevels)
      : this.createSliderOptions(this.skillLevels);

    this.languageOptions = this.createSliderOptions(this.languageLevels);

    this.subscriptions.add(
      this.skillForm
        .get('expirienceInMonths')
        ?.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe((value) => this.onMonthsChange(value))
    );

    this.subscriptions.add(
      this.skillForm
        .get('expirienceInYears')
        ?.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe((value) => this.onYearsChange(value))
    );

    this.changeDetectorRef.markForCheck();
  }
  
  ngAfterViewInit(): void {
    this.onMonthsChange(this.skillForm.get('months')?.value);
  }
  
  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onYearsChange(expirienceInYears: any): void {
    const months = expirienceInYears * 12;
    const formattedMonths = months.toFixed(0);

    this.skillForm.patchValue(
      {
        expirienceInMonths: formattedMonths,
      },
      { emitEvent: false }
    );
  }

  onMonthsChange(expirienceInMonths: number): void {
    const years = expirienceInMonths / 12;
    const formattedYears = years.toFixed(1);

    this.skillForm.patchValue(
      {
        expirienceInYears: formattedYears,
      },
      { emitEvent: false }
    );
  }

  createSliderOptions(levels: string[]): Options {
    return {
      showTicks: true,
      showTicksValues: true,
      floor: 0,
      ceil: levels.length - 1,
      step: 1,
      translate: (value: number, label: LabelType): string => {
        const index = Math.round(value);
        const level = levels[index] || value.toString();
        switch (label) {
          case LabelType.Low:
            return `${level}`;
          case LabelType.High:
            return `${level}`;
          default:
            return level;
        }
      },
      ticksArray: levels.map((_, index) => index),
      ticksTooltip: (value: number) => {
        const index = Math.round(value);
        return levels[index] || value.toString();
      },
    };
  }

  onExpirienceChange(value: number) {
    if (value < 1) {
      this.skill.expirienceInMonths = 1;
    } else if (value > 100) {
      this.skill.expirienceInMonths = 100;
    } else {
      this.skill.expirienceInMonths = value;
    }
  }

  chosenYearHandlerStart(
    normalizedYear: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.startMonth);
    ctrlValue.setFullYear(normalizedYear.getFullYear());

    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startMonth = ctrlValue;
    this.changeDetectorRef.markForCheck();
  }

  chosenMonthHandlerStart(
    normalizedMonth: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.startMonth);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startMonth = ctrlValue;
    datepicker.close();
    this.changeDetectorRef.markForCheck();
  }

  createSkillForm(skillType: SkillType): FormGroup {
    switch (skillType) {
      case SkillType.hard:
        return this.formBuilder.group<HardSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          subGroup: new FormControl('', [Validators.required]),
          proficiencyEstimation: new FormControl('', [Validators.required]),
          expirienceInMonths: new FormControl('', [Validators.required]),
          expirienceInYears: new FormControl('', [Validators.required]),
          startMonth: new FormControl('', [Validators.required]),
        });

      case SkillType.soft:
        return this.formBuilder.group<SoftSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          subGroup: new FormControl('', [Validators.required]),
          intensityEstimation: new FormControl('', [Validators.required]),
        });
      case SkillType.domain:
        return this.formBuilder.group<DomainSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          subGroup: new FormControl('', [Validators.required]),
          proficiencyEstimation: new FormControl('', [Validators.required]),
          expirienceInMonths: new FormControl('', [Validators.required]),
          expirienceInYears: new FormControl('', [Validators.required]),
        });
      case SkillType.managirial:
        return this.formBuilder.group<ManagerialSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          subGroup: new FormControl('', [Validators.required]),
          intensityEstimation: new FormControl('', [Validators.required]),
        });
      case SkillType.language:
        return this.formBuilder.group<LanguageSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          languageSkillType: new FormControl('', [Validators.required]),
          proficiencyEstimation: new FormControl('', [Validators.required]),
          expirienceInMonths: new FormControl('', [Validators.required]),
          expirienceInYears: new FormControl('', [Validators.required]),
        });
      case SkillType.operationalExperience:
        return this.formBuilder.group<OperationalExperienceSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          companyName: new FormControl('', [Validators.required]),
          startWorkDate: new FormControl('', [Validators.required]),
          endWorkDate: new FormControl('', [Validators.required]),
          achievements: new FormControl('', [Validators.required]),
          isCurrent: new FormControl('', [Validators.required]),
          jobTitle: new FormControl('', [Validators.required]),
          resposiblities: new FormControl('', [Validators.required]),
          skills: new FormControl('', [Validators.required]),
        });
      case SkillType.academic:
        return this.formBuilder.group<AcademicEducationSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          certificateNumber: new FormControl('', [Validators.required]),
          startStudyDate: new FormControl('', [Validators.required]),
          graduationDate: new FormControl('', [Validators.required]),
          currentlyStudying: new FormControl('', [Validators.required]),
          academicEducationLevelType: new FormControl('', [
            Validators.required,
          ]),
          faculty: new FormControl('', [Validators.required]),
          institution: new FormControl('', [Validators.required]),
          fieldOfStudy: new FormControl('', [Validators.required]),
          specialication: new FormControl('', [Validators.required]),
        });
      case SkillType.certification:
        return this.formBuilder.group<CertificateSkillForm>({
          skillName: new FormControl('', [Validators.required]),
          description: new FormControl('', [Validators.required]),
          certificateNumber: new FormControl('', [Validators.required]),
          certificationDate: new FormControl('', [Validators.required]),
          certificationCenter: new FormControl('', [Validators.required]),
        });
      default:
        return this.formBuilder.group({});
    }
  }

  filterSubGroup(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.filteredSubGroup = this.subGroups.filter((company: string) =>
      company.toLowerCase().includes(input.toLowerCase())
    );
  }

  toggleDropdown(): void {
    if (this.filteredSubGroup.length == 0) {
      this.filteredSubGroup = this.subGroups;
    } else {
      this.filteredSubGroup = [];
    }
    this.isOpen = !this.isOpen;
  }

  removeItem(skill: Skill): void {
    console.log('removeItem', skill);
    const executeDelete = async (data: any) => {
      if (data) {
        this.service.removeSkillFromCollection(
          skill.skillType,
          skill.skillName
        );
        this.changeDetectorRef.markForCheck();
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
  }
}
