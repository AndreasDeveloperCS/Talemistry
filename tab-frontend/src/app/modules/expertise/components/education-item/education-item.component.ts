import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDatepicker } from '@angular/material/datepicker';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { University } from '../../../universities/models/university';
import { AcademicEducationLevelType, EducationInstitution, Skill, SkillType, UserAcademicEducation } from '../../../skills/models/skill';
import { ContentService } from '../../../general/services/content.service';
import { UniversityService } from '../../../universities/services/university.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-education-item',
  templateUrl: './education-item.component.html',
  styleUrl: './education-item.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationItemComponent extends InputFilterBaseComponent<University> implements OnInit, AfterViewInit {
  educationTypes: AcademicEducationLevelType[] = Object.values(
    AcademicEducationLevelType
  );
  @Output()
  AcademicListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() placeholderText: string = '';
  @Input() itemType: string = '';
  @Input() itemNames: any[] = [];

  @Input()
  public skillFilterType: SkillType = SkillType.academic;

  @Input()
  skill: UserAcademicEducation = new UserAcademicEducation();

  public educationItemForm: FormGroup;

  @ViewChild('monthSelector') monthSelector?: ElementRef;

  selectedUniversity: University = new University();
  educationalInstitution!: any;

  constructor(
    public content: ContentService,
    public service: CandidateUserProfileService,
    public universitiesService: UniversityService,
    private dialogHelper: DialogHelperService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef
  ) {
    super(universitiesService, searchLogicService, changeDetectorRef);
    this.educationItemForm = new FormGroup({
      skillName: new FormControl(),
      faculty: new FormControl(),
      // educationItemName: new FormControl(),
      certificateNumber: new FormControl(),
      specialication: new FormControl(),
      academicEducationLevelType: new FormControl(),
      institution: new FormControl(),
      fieldOfStudy: new FormControl(),
      startStudyDate: new FormControl(Date),
      graduationDate: new FormControl(Date),
      currentlyStudying: new FormControl(),
    });

    this.filterControl = new FormControl('', [
      Validators.pattern(/^(?!\s*$).+/),
    ]);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.skill?.institution) {
      const inst = this.skill.institution;
      this.rawInputlValue = inst.internationalName || (inst as any).name || '';
      this.skill.institutionName = this.rawInputlValue;
      // ✅ Use filterControl since it's bound to the input
      console.log('rawInputlValue', this.rawInputlValue);
      this.filterControl.setValue(this.rawInputlValue, { emitEvent: false });
      console.log('filterControl', this.filterControl);
    }
  }

  currentDate: Date = new Date();

  onIsCurrentChange(event: MatCheckboxChange) {
    if (event.checked) {
      this.skill.currentlyStudying = true;
    } else {
      this.skill.currentlyStudying = false;
    }
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    // this.listenForScrollEvent();
    this.cdr.detectChanges();
  }

  chosenYearHandlerStart(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    const ctrlValue = new Date(this.skill.startStudyDate);
    ctrlValue.setFullYear(normalizedYear.getFullYear());

    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startStudyDate = ctrlValue;
  }

  chosenMonthHandlerStart(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    const ctrlValue = new Date(this.skill.startStudyDate);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.startStudyDate = ctrlValue;
    //datepicker.close();
  }

  chosenYearHandlerEnd(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    const ctrlValue = new Date(this.skill.graduationDate);
    ctrlValue.setFullYear(normalizedYear.getFullYear());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.graduationDate = ctrlValue;
  }

  chosenMonthHandlerEnd(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    const ctrlValue = new Date(this.skill.graduationDate);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.skill.graduationDate = ctrlValue;
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    //datepicker.close();
  }

  removeItem(skill: UserAcademicEducation): void {
    const executeDelete = async (data: any) => {
      if (data) {
        const targetIndex = this.service.model.academicEducation.findIndex(element => element.skillType == skill.skillType 
          && element.certificateNumber == skill.certificateNumber && element.institutionName == skill.institutionName 
          && element.faculty == skill.faculty && element.specialication == skill.specialication);
        this.service.model.academicEducation.splice(targetIndex, 1);
        this.cdr.markForCheck();
      }
    };
    this.dialogHelper.confirmationDialog(executeDelete);
  }

  async selectUniversity($event: any) {
    //  // console.log('select University', $event);
  }

  async filterUniversity($event: any) {
    //  // console.log('filter University', $event);
  }

  async validateBlur(value: any) {
    console.log('validateBlur', value);
    if (typeof this.rawInputlValue === 'string') {
      console.log('This is a string:', value);
      this.setInstitutionalName(value);
    } 
  }

  onSelectionChange($event: any) {
    console.log('onSelectionChange', $event.option.value.name);
    this.setInstitutionalName($event.option.value.name);
  }

  setInstitutionalName(name: string) {
    console.log('setInstitutionalName', name);
    if (this.skill.institution) {
      this.skill.institution.internationalName = name;
      this.rawInputlValue = name;
    } else {
      this.skill.institution = new EducationInstitution();
      this.skill.institution.internationalName = name;
      this.rawInputlValue = name;
    }
  }
  onOptionSelected($event: any): void {
    console.log('onOptionSelected', $event);
    const institution = $event.option.value;
    console.log('onOptionSelected', institution);
    this.filterControl.setValue(institution);
    this.setInstitutionalName(institution);

    this.filteredCollection = [institution];
    this.isOpen = false;
  }

  getValue(option: University) {
    return option.name;
  }

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<EducationInstitution>((e: EducationInstitution) => e.name), value: this.filterControl.value });
    return this._filterParams;
  }
}