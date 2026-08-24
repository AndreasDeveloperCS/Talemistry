import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  selector: 'app-position-skill-unified',
  templateUrl: './position-skill-unified.component.html',
  styleUrl: './position-skill-unified.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionSkillUnifiedComponent extends InputFilterBaseComponent<PositionSkill> implements OnInit {
  @Input()
  roleProfessioncyLevel!: ProficiencyLevel;

  @Output()
  removingSkill: EventEmitter<any> = new EventEmitter<any>();

  proficiencyLevels: ProficiencyLevel[] = Object.values(ProficiencyLevel);
  SkillImportanceCollection: SkillImportance[] = Object.values(SkillImportance);
  
  skillTypes: SkillType[] = [
    SkillType.hard,
    SkillType.soft,
    SkillType.domain,
    SkillType.managirial,
    SkillType.language
  ];

  skillsFilterControl = new FormControl('');
  filteredOptions!: Observable<string[]>;
  filteredSkills: any = [];
  itemsControl: FormControl;
  positionsList: PositionSkill[] = [];
  skillTypeInputValue: SkillType = SkillType.hard;
  skillProficiencyInputValue: ProficiencyLevel = ProficiencyLevel.Regular;
  skillImportanceInputValue: SkillImportance = SkillImportance.mandatory;

  override get filterParams(): { column: string, value: any }[] {
    if(this._filterParams) {
      this._filterParams.splice(0, this._filterParams.length);
      this._filterParams.push({ column: getPropertyName<PositionSkill>((e: PositionSkill) => e.skillName), value: this.filterControl.value });
    }
    return this._filterParams;
  }

  constructor(public service: PositionSkillsService,
    public positionService: PositionsService,
    searchLogicService: SearchLogicService,
    private changeDetectorRef: ChangeDetectorRef, 
    public content: ContentService,
  ) {
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
    this.positionService.modelUpdated$
    .pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
      this.positionsList = this.positionService.model.positionDetails.requirements.positionSkills;
      this.changeDetectorRef.markForCheck();
    });
    this.applyLocalFilter();
  }

  getSkillTypeIcon(type: SkillType): string {
    switch (type) {
      case SkillType.hard: 
        return 'build';
      case SkillType.soft: 
        return 'psychology';
      case SkillType.domain: 
        return 'domain';
      case SkillType.managirial: 
        return 'supervisor_account';
      case SkillType.language: 
        return 'language';
      default: 
        return 'star';
    }
  }

  getFirstWord(type: string): string {
    return type.split(' ')[0];
  }

  getValue(option: Skill) {
    return option.skillName;
  }

  getPositionSkill(skillName: string): PositionSkill {
    const skill: PositionSkill = new PositionSkill();
    {
      skill.skillType = this.skillTypeInputValue as SkillType,
      skill.skillName = skillName,
      skill.skillImportance = this.skillImportanceInputValue as SkillImportance,
      skill.weightedCoefficient = this.getWeightedCoefficient(skill.skillImportance),
      skill.proficiencyLevel = this.skillProficiencyInputValue as ProficiencyLevel;
    }
    return skill;
  }

  async add() {
    const skillName = this.rawInputlValue.trim();
    if (skillName && !this.positionsList?.some(s => s.skillName === skillName)) {
      const newSkill = this.getPositionSkill(skillName);
      console.log('new Skill', newSkill);
      this.positionService.model.positionDetails.requirements.positionSkills.push(newSkill);
      this.positionService.notifyUpdate();
  
      this.resetForm();
    }
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

  remove(skill: PositionSkill) {
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