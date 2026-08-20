import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AcademicEducation, AcademicEducationLevelType, Certification, DomainSkill, HardSkill,
  LanguageSkill, LanguageSkillType, OperationalExpirience, Skill, SkillArtifact, SkillType, SoftSkill
} from '../../../skills/models/skill';
import { SkillModel } from '../../../skills/models/skill-form';
import { ContentService } from '../../../general/services/content.service';
import { SkillsService } from '../../../skills/services/skills.service';
import { HttpService } from '../../../general/services/http.service';

@Component({
  selector: 'app-additional-skills',
  templateUrl: './additional-skills.html',
  styleUrl: './additional-skills.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdditionalSkillsComponent {

  public educationLevel: AcademicEducationLevelType = AcademicEducationLevelType.other;
  public skillTypes: SkillType[] = Object.entries(SkillType).map((value: [string, SkillType], index: number, array: [string, SkillType][]) => value[1]);
  public languageSkillTypes: string[] = Object.values(LanguageSkillType);
  public academicEducationLevels: AcademicEducationLevelType[] = Object.entries(AcademicEducationLevelType).map((value: [string, AcademicEducationLevelType], index: number, array: [string, AcademicEducationLevelType][]) => value[1]);

  public academicEducationLevel: AcademicEducationLevelType = AcademicEducationLevelType.other;
  public languageSkillType: LanguageSkillType = LanguageSkillType.general;

  getSkill(skillType: SkillType): SkillArtifact {

    switch (skillType) {

      case SkillType.hard:
        return new HardSkill();
      case SkillType.soft:
        return new SoftSkill();
      case SkillType.domain:
        return new DomainSkill();

      case SkillType.language:
        return new LanguageSkill();

      case SkillType.academic:
        return new AcademicEducation();

      case SkillType.certification:
        return new Certification();

      case SkillType.operationalExperience:
        return new OperationalExpirience();

      default:
        return new Skill();
    }

  }

  public skillType: SkillType = SkillType.other;
  public skill: SkillArtifact = this.getSkill(this.skillType);
  public skillDataForm!: FormGroup<SkillModel>;

  constructor(public content: ContentService,
    private service: SkillsService,
    private formBuilder: FormBuilder,
    public httpService: HttpService,) {
    this.skillDataForm = formBuilder.group<SkillModel>({
      skillName: new FormControl(this.skill.skillName, [Validators.required]),
    });
  }

  async onAddSkill(): Promise<any> {
    if (this.skillDataForm.valid) {

      const skill: Skill = {
        skillType: this.skill.skillType,
        skillName: this.skillDataForm.value.skillName,
        isVerified: false
      }

      await this.service.createAsync(skill);
      this.skillDataForm.reset();
    }
  }

}
