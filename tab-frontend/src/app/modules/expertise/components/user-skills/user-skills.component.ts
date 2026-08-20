import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { Skill, SkillType } from '../../../skills/models/skill';
import { Filter, FilterRule, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { SkillsService } from '../../../skills/services/skills.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-user-skills',
  templateUrl: './user-skills.component.html',
  styleUrl: './user-skills.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSkillsComponent extends InputFilterBaseComponent<Skill> {
  @Input()
  placeholderText: string = '';

  @Input()
  public skillType: SkillType = SkillType.other;

  @Input()
  public skillIcon: string = '';

  @Output()
  setSkillNameEvent = new EventEmitter<{ skill: any }>();
  
  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete!: MatAutocompleteTrigger;

  errorMessage: string = '';
  searchingList: string[] = [];
  selectedSkill: Skill = new Skill();
  errors: string[] = [];
  showSearches: boolean = false;
  isSearching: boolean = false;
  showAutocomplete = false;
  mainFilter!: Filter;
  secondFilter!: Filter;
  suppressFocus = true;

  override sorting: Sorting = {
    property: getPropertyName<Skill>((e: Skill) => e.skillName),
    direction: 'ASC'
  };

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<Skill>((e: Skill) => e.skillName), value: this.filterControl.value });
    this._filterParams.push({ column: getPropertyName<Skill>((e: Skill) => e.skillType), value: this.skillType });
    return this._filterParams;
  }

  override get populatedCollection() {
    switch (this.skillType) {
      case SkillType.hard:
        return this.cpService.model.hardSkills;
      case SkillType.soft:
        return this.cpService.model.softSkills;
      case SkillType.managirial:
        return this.cpService.model.managerialSkills;
      case SkillType.domain:
        return this.cpService.model.domainSkills;
      case SkillType.language:
        return this.cpService.model.languagesSkills;
      default:
        return this.cpService.model.skills;
    }
  }

  constructor(
    crudService: SkillsService,
    searchLogicService: SearchLogicService,
    public changeDetectorRef: ChangeDetectorRef,
    private cpService: CandidateUserProfileService,
    public content: ContentService,
  ) {
    super(crudService, searchLogicService, changeDetectorRef)
    this.filterControl = new FormControl('', [
      Validators.pattern(/^(?!\s*$).+/),
    ]);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    setTimeout(() => {
      this.suppressFocus = false;
      this.changeDetectorRef.markForCheck();
    }, 0);
  }

  override ngOnInit(): void {
    this.mainFilter = {
      property: getPropertyName<Skill>((e: Skill) => e.skillType),
      rule: FilterRule.EQUALS,
      value: this.skillType
    };
    this.secondFilter = {
      property: getPropertyName<Skill>((e: Skill) => e.isVerified),
      rule: FilterRule.EQUALS,
      value: true
    };
    this.filtering.push(this.mainFilter);
    this.filtering.push(this.secondFilter);
    super.ngOnInit();
    this.changeDetectorRef.markForCheck();
  }

  
  @HostListener('keydown.enter', ['$event'])
  onEnter(e: KeyboardEvent) {
    if (e.isComposing) {
      return;
    }
    if (this.autocompleteTrigger?.panelOpen) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const value = this.rawInputlValue?.trim();
    console.log('HostListener', value);

    if (value) {
      this.add(value);
    }
  }

  onValueChanged($event: any) {
    // console.log('onValueChanged', $event);
  }

  getValue(option: Skill) {
    return option.skillName;
  }

  selectItem(option: any) {
    this.add(this.getValue(option));
    this.showAutocomplete = false;
    this.rawInputlValue = '';
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();
    this.autoComplete?.closePanel();

    if (!input && input == "") {
      this.errors.push("Field can not be empty");
      setTimeout(() => {
        this.errors = [];
      }, 5000);
      return;
    }

    if (!this.inputControl.valid && new RegExp('^\\s*$').test(input)) {
      this.errors.push("Input is not valid");
      setTimeout(() => {
        this.errors = [];
      }, 5000);
      return;
    }

    if (this.cpService.model.skills.some(skill => skill.skillType == this.skillType && skill.skillName == input)) {
      this.errors.push("The record with the same name and type has been already added");
      setTimeout(() => {
        this.errors = [];
        this.changeDetectorRef.markForCheck();
      }, 5000);
      return;
    }

    if (this.inputControl.valid) {
      this.errors.splice(0, this.errors.length);
      const addedItem = this.cpService.addNewSkillToCollection(this.skillType, input);
      addedItem.isVerified = false;
      this.crudService.createAsync(addedItem, true, true);
      this.changeDetectorRef.markForCheck();
      this.resetForm();
    }

    this.cpService.saveCacheCurrentStateIntoInternalStorage();
    this.rawInputlValue = '';
  }

  clearFilterText() {
    this.rawInputlValue = '';
  }

  remove(item: Skill) {
    console.log('Skills Before', this.cpService.model.hardSkills);
    console.log('remove Skill', item);
    this.cpService.removeSkillFromCollection(item.skillType, item.skillName);
    console.log('Skills After', this.cpService.model.hardSkills);
  }
}
