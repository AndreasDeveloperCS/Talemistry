import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SkillModel } from '../../models/skill-form';
import { SkillsService } from '../../services/skills.service';
import { AcademicEducation, AcademicEducationLevelType, Certification, DomainSkill, HardSkill, LanguageSkill, LanguageSkillType, OperationalExpirience, Skill, SkillType, SoftSkill } from '../../models/skill';
import { ContentService } from '../../../general/services/content.service';
import { HttpService } from '../../../general/services/http.service';

@Component({
    selector: 'app-skill-form',
    templateUrl: './skill-form.component.html',
    styleUrl: './skill-form.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillFormComponent {
  SkillTypeEnum: typeof SkillType = SkillType;
  public educationLevel:AcademicEducationLevelType = AcademicEducationLevelType.other;
  public skillTypes:SkillType[] = Object.entries(SkillType).map((value: [string, SkillType], index: number, array: [string, SkillType][])=>value[1] );
  public languageSkillTypes:string[] = Object.entries(LanguageSkillType).map((value: [string, LanguageSkillType], index: number, array: [string, LanguageSkillType][])=>value[1] );
  public academicEducationLevels:AcademicEducationLevelType[] = Object.values(AcademicEducationLevelType);
  public academicEducationLevel:AcademicEducationLevelType = AcademicEducationLevelType.other;
  public languageSkillType:LanguageSkillType = LanguageSkillType.general;

  isEdit: boolean = false;
  controlButtonContent: string = "";

  getSkill(skillType: SkillType): Skill {
    switch(skillType) {
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

  private _selectedSkillType: SkillType = SkillType.other;
  public get selectedSkillType(): SkillType {
    return this._selectedSkillType;
  }
  public set selectedSkillType(value: SkillType) {
    this._selectedSkillType = value;
    this.skill = this.getSkill(value);
  }
  public skill:Skill = this.getSkill(this.selectedSkillType);
  public skillDataForm!: FormGroup;

  constructor(public content: ContentService, 
    private formBuilder: FormBuilder,
    public httpService:HttpService,
    @Inject(MAT_DIALOG_DATA)
    public data: Skill,
    public dialog: MatDialog, 
    public dialogRef: MatDialogRef<SkillFormComponent>){
    this.skillDataForm = this.formBuilder.group({ 
      skillType: [this.data.skillType, Validators.required],
      skillName: [this.data.skillName, Validators.required],
    });
    this.isEdit = this.data != undefined;
    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  async onAddSkill():Promise<any>{
    if(this.skillDataForm.valid) {
      const skill: Skill= {
        skillType : this.skill.skillType,
        skillName : this.skillDataForm.value.skillName,
        isVerified:false    
      }
      this.dialogRef.close(skill);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
