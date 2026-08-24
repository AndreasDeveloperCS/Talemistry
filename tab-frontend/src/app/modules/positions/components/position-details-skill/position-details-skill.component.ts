import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, takeUntil } from 'rxjs';
import { PositionSkill, SkillImportance } from '../../models/position-details';
import { PositionsService } from '../../services/positions.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { ProficiencyLevel, Skill, SkillType } from '../../../skills/models/skill';
import { PositionSkillsService } from '../../../skills/services/position-skills.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-position-details-skill',
  templateUrl: './position-details-skill.component.html',
  styleUrl: './position-details-skill.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsSkillComponent extends InputFilterBaseComponent<PositionSkill> implements OnInit {
  @Input()
  public skill!: PositionSkill;

  @Input()
  public skillType!: SkillType;

  @Input()
  roleProfessioncyLevel!: ProficiencyLevel;

  @Input()
  placeholderText: string = '';
  
  @Output()
  removingSkill: EventEmitter<any> = new EventEmitter<any>();

  public SkillImportanceCollection: SkillImportance[] = Object.values(SkillImportance);
  filteredSkills: any = [];
  itemsControl: FormControl;
  positionsList: PositionSkill[] = [];
  proficiencyLevels: ProficiencyLevel[] = Object.values(ProficiencyLevel);
  proficiencyLevel: ProficiencyLevel = ProficiencyLevel.Beginner;
  searchingList: string[] = [];
  skillsFilterControl = new FormControl('');
  filteredOptions!: Observable<string[]>;
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<PositionSkill>((e: PositionSkill) => e.skillName), value: this.filterControl.value });
    this._filterParams.push({ column: getPropertyName<PositionSkill>((e: PositionSkill) => e.skillType), value: this.skillType });
    return this._filterParams;
  }

  constructor(public service: PositionSkillsService,
    public positionService: PositionsService,
    searchLogicService: SearchLogicService,
    private changeDetectorRef: ChangeDetectorRef, public content: ContentService,) {
    super(service, searchLogicService, changeDetectorRef)
    this.itemsControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?!\s*$).+/),
    ]);
    this.filterControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?!\s*$).+/),
    ]);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.positionService.notifyUpdate();
    this.populateCollection();
    this.collection = this.collection.filter(skill => skill.skillType === this.skillType);
    this.positionService.modelUpdated$
    .pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
      this.positionsList = this.positionService.model.positionDetails.requirements.positionSkills
        ?.filter(skill => skill.skillType === this.skillType);
      this.changeDetectorRef.markForCheck();
    });
    this.applyLocalFilter();
  }

  async add(skillValues: string) {
    const skillName = skillValues.trim();
    if (
      skillName &&
      !this.positionsList?.some(s => s.skillName === skillName)
    ) {
      const newSkill = this.getPositionSkill(this.skillType, skillName);
  
      this.positionService.model.positionDetails.requirements.positionSkills.push(newSkill);
      this.positionService.notifyUpdate();
  
      this.resetForm();
    }
  }  

  getValue(option: Skill) {
    return option.skillName;
  }

  getPositionSkill(skillType: SkillType, skillName: string): PositionSkill {
    const skill: PositionSkill = new PositionSkill();
    {
      skill.skillType = skillType,
        skill.skillName = skillName,
        skill.skillImportance = SkillImportance.mandatory,
        skill.weightedCoefficient = 100,
        skill.proficiencyLevel = this.roleProfessioncyLevel;
    }
    return skill;
  }

  onSkillImportanceChange(item: PositionSkill, importance: SkillImportance) {
    item.skillImportance = importance;
    item.weightedCoefficient = this.getWeightedCoefficient(importance);
    this.positionService.updatePositionSkill(item);
    this.positionService.notifyUpdate();
  }

  getWeightedCoefficient(importance: SkillImportance): number {
    switch (importance) {
      case SkillImportance.mandatory:
        return 100;
      case SkillImportance.desired:
        return 75;
      case SkillImportance.niceToHave:
        return 50;
      case SkillImportance.optional:
        return 25;
    }
  }

  onSeniorityLevelChange(item: PositionSkill, seniorityLevel?: ProficiencyLevel) {
    item.proficiencyLevel = seniorityLevel;
    this.positionService.model.positionDetails.requirements.positionSkills.map(skill => {
      if (skill.skillName === item.skillName && skill.skillType === item.skillType) {
        skill.proficiencyLevel = seniorityLevel;
      }
      return skill;
    });
    this.positionService.notifyUpdate();
  }

  filterSkills(skill: any) {
    return this.searchingList.filter(
      (val) => val.toLowerCase().includes(skill.toLowerCase()) == true
    );
  }

  removeSkill(skill: PositionSkill) {
    const index = this.positionService.model.positionDetails.requirements.positionSkills.findIndex(s =>
      s.skillName === skill.skillName
    );
    if (index !== -1) {
      this.positionService.model.positionDetails.requirements.positionSkills.splice(index, 1);
    } else {
      console.warn('Skill not found:', skill);
    }
    this.positionService.notifyUpdate();
  }
}