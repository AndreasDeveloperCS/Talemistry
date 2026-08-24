import { AbstractControl } from "@angular/forms";

export class HardSkillForm
{
  skillName?: AbstractControl<any, any>;
  subGroup?: AbstractControl<any, any>;
  proficiencyEstimation?: AbstractControl<any, any>;
  expirienceInMonths?: AbstractControl<any, any>;
  expirienceInYears?: AbstractControl<any, any>
  startMonth?: AbstractControl<any, any>;
}

export class SoftSkillForm
{
  skillName?: AbstractControl<any, any>;
  subGroup?: AbstractControl<any, any>;
  intensityEstimation?: AbstractControl<any, any>;
}

export class DomainSkillForm{
  skillName?: AbstractControl<any, any>;
  subGroup?: AbstractControl<any, any>;
  proficiencyEstimation?: AbstractControl<any, any>;
  expirienceInMonths?: AbstractControl<any, any>;
  expirienceInYears?: AbstractControl<any, any>
}

export class ManagerialSkillForm
{
  skillName?: AbstractControl<any, any>;
  subGroup?: AbstractControl<any, any>;
  intensityEstimation?: AbstractControl<any, any>;
}

export class LanguageSkillForm{
  skillName?: AbstractControl<any, any>;
  languageSkillType?: AbstractControl<any, any>;
  proficiencyEstimation?: AbstractControl<any, any>;
  expirienceInMonths?: AbstractControl<any, any>;
  expirienceInYears?: AbstractControl<any, any>
}

export class OperationalExperienceSkillForm{
  skillName?: AbstractControl<any, any>;
  companyName?: AbstractControl<any, any>;
  startWorkDate?: AbstractControl<any, any>;
  endWorkDate?: AbstractControl<any, any>;
  // additionalInfo?: AbstractControl<any, any>;
  achievements?: AbstractControl<any, any>;
  isCurrent?: AbstractControl<any, any>;
  jobTitle?: AbstractControl<any, any>;
  resposiblities?: AbstractControl<any, any>;
  skills?: AbstractControl<any, any>;
}

export class AcademicEducationSkillForm{
  skillName?: AbstractControl<any, any>;
  certificateNumber?: AbstractControl<any, any>;
  startStudyDate?: AbstractControl<any, any>;
  graduationDate?: AbstractControl<any, any>;
  currentlyStudying?: AbstractControl<any, any>;
  academicEducationLevelType?: AbstractControl<any, any>;
  institution?: AbstractControl<any, any>;
  faculty?: AbstractControl<any, any>;
  fieldOfStudy?: AbstractControl<any, any>;
  specialication?: AbstractControl<any, any>;
}

export class CertificateSkillForm{
  skillName?: AbstractControl<any, any>;
  description?: AbstractControl<any, any>;
  certificateNumber?: AbstractControl<any, any>;
  certificationDate?: AbstractControl<any, any>;
  certificationCenter?: AbstractControl<any, any>;
}

export class  SkillModel{
  skillType?: AbstractControl<any, any>;
  skillName?: AbstractControl<any, any>;
}