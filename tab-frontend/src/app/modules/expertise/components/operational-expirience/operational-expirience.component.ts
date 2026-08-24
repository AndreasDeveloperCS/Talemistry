import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDatepicker } from '@angular/material/datepicker';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CompanyVersion } from '../../../companies/models/company';
import { CompaniesService } from '../../../companies/services/companies.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { OperationalExpirience, Skill, SkillType, UserOperationalExpirience } from '../../../skills/models/skill';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-operational-expirience',
  templateUrl: './operational-expirience.component.html',
  styleUrl: './operational-expirience.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalExpirienceComponent extends InputFilterBaseComponent<CompanyVersion> implements OnInit {
  @Input() 
  itemNames: any[] = [];

  @Input()
  operationalExperience: UserOperationalExpirience =  new UserOperationalExpirience();

  @Input() 
  skill!: UserOperationalExpirience;

  @Input() 
  skillType: SkillType = SkillType.operationalExperience;
  
  @Output()
  ExperienceListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('monthSelector') monthSelector?: ElementRef;

  public startWorkNewPositionDate: Date = new Date();
  public endWorkNewPositionDate: Date = new Date();

  public workExpirienceForm: FormGroup;
  currentDate: Date = new Date();

  forms: any[] = [];

  constructor(
    crudService: CompaniesService,
    private dialogHelper: DialogHelperService,
    private fb: FormBuilder,
    public content: ContentService,
    public service: CandidateUserProfileService,
    searchLogicService: SearchLogicService,
    public changeDetectorRef: ChangeDetectorRef
  ) {
    super(crudService, searchLogicService, changeDetectorRef);

    this.workExpirienceForm = this.fb.group({
      //companyName: new FormControl(),
      experiences: this.fb.array([this.createExperience()]),
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.skill.company?.data?.companyName) {
      this.rawInputlValue = this.skill.company.data.companyName;
      this.filterControl.setValue(this.rawInputlValue, { emitEvent: false });
    } else if (this.skill.companyName) {
      this.rawInputlValue = this.skill.companyName;
      this.filterControl.setValue(this.rawInputlValue, { emitEvent: false });
    }
    this.changeDetectorRef.markForCheck();
  }

  get experiences(): FormArray {
    return this.workExpirienceForm.get('experiences') as FormArray;
  }

  createExperience(): FormGroup {
    const fb = new FormGroup({
      jobTitle: new FormControl<string>(''),
      startWorkDate: new FormControl<Date>(new Date()),
      endWorkDate: new FormControl<Date>(new Date()),
      isCurrent: new FormControl<boolean>(false),
      resposiblities: new FormControl<string>(''),
      achievements: new FormControl<string>(''),
    })
    console.log('createExperience', fb);

    return fb;
  }

  addExperience(): void {
    this.experiences.push(this.createExperience());
    this.service.saveCacheCurrentStateIntoInternalStorage();
  }

  errorMessage: string = '';

  onIsCurrentChange(event: MatCheckboxChange, index: number) {
    if (event.checked) {
      const experienceGroup = this.experiences.at(index) as FormGroup;
      experienceGroup.get('isCurrent')?.setValue(true);
    } else {
      const experienceGroup = this.experiences.at(index) as FormGroup;
      experienceGroup.get('isCurrent')?.setValue(false);
    }
  }

  chosenYearHandlerStart(
    normalizedYear: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.startWorkDate);
    ctrlValue.setFullYear(normalizedYear.getFullYear());

    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startWorkDate = ctrlValue;
    this.changeDetectorRef.markForCheck();
  }

  chosenMonthHandlerStart(
    normalizedMonth: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.startWorkDate);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startWorkDate = ctrlValue;
    datepicker.close();
    this.changeDetectorRef.markForCheck();
  }

  chosenYearHandlerEnd(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    const ctrlValue = new Date(this.skill.endWorkDate);
    ctrlValue.setFullYear(normalizedYear.getFullYear());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.endWorkDate = ctrlValue;
    this.changeDetectorRef.markForCheck();
  }

  chosenMonthHandlerEnd(
    normalizedMonth: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.endWorkDate);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.skill.endWorkDate = ctrlValue;
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    datepicker.close();
    this.changeDetectorRef.markForCheck();
  }

  filterCollection(event: Event): void {
    const input = (event.target as HTMLInputElement).value;

    if (!input) {
      this.filteredCollection = this.collection;
      return;
    }
    this.filteredCollection = this.collection.filter((company: CompanyVersion) =>
      company?.data.companyName.toLowerCase().includes(input.toLowerCase())
    );
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    console.log('onOptionSelected', event);
    const value = event.option.value;

    const selectedItem = value as CompanyVersion;

    if (selectedItem?.data?.companyName && selectedItem._id) {
      this.skill.companyName = selectedItem.data.companyName;
      this.skill.companyId = selectedItem._id;
      this.skill.company = selectedItem;

      // store string for compatibility with base class
      this.rawInputlValue = selectedItem.data.companyName;
      this.filterControl.setValue(selectedItem.data.companyName, { emitEvent: false });
    }

    this.isOpen = false;
  }

  removeExperience(index: number): void {
    const executeDelete = async (data: any) => {
      if (data) {
        this.experiences.removeAt(index);
        this.service.saveCacheCurrentStateIntoInternalStorage();
        this.changeDetectorRef.markForCheck();
      }
    };
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  removeItem(skill: UserOperationalExpirience): void {
    const executeDelete = async (data: any) => {
      if (data) {
        const targetIndex = this.service.model.operationalExperience.findIndex(element => element.skillType == skill.skillType && element.jobTitle == skill.jobTitle && element.companyName == skill.companyName);
        this.service.model.operationalExperience.splice(targetIndex, 1);
        this.changeDetectorRef.markForCheck();
      }
    };
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  getValue(option: CompanyVersion) {
    return option.data?.companyName;
  }

  displayFn(value: string | CompanyVersion | null): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.data?.companyName || '';
  }

  override get filterParams(): { column: string; value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);

    this._filterParams.push({
      column: getPropertyName<CompanyVersion>((e: CompanyVersion) => e.data.companyName),
      value: this.filterControl.value,
    });

    return this._filterParams;
  }

  onInputChange(value: string | CompanyVersion | null): void {
    console.log('onInputChange', value);
    let typed = '';

    if (typeof value === 'string') {
      typed = value.trim();
    } else if (typeof this.rawInputlValue === 'string') {
      typed = this.rawInputlValue.trim();
    }

    // Case 1: selected from autocomplete (object)
    if (value && typeof value !== 'string') {
      const selected = value as CompanyVersion;
      this.skill.companyName = selected.data?.companyName ?? '';
      this.skill.companyId = selected._id;
      this.skill.company = selected;
      this.rawInputlValue = selected.data?.companyName ?? '';
    } 
    // Case 2: user just typed text
    else {
      this.skill.companyName = typed;
      this.rawInputlValue = typed;

      const match = (this.collection ?? []).find(
        c => (c.data?.companyName ?? '').toLowerCase() === typed.toLowerCase()
      );

      if (match) {
        this.skill.companyId = match._id;
        this.skill.company = match;
        this.filterControl?.setValue(match, { emitEvent: false });
      } else {
        this.skill.companyId = null;
        this.skill.company = undefined;
      }
    }
  }
}
