import { CompanyVersion } from "../../companies/models/company";
import { BaseEntity } from "../../general/models/base-entity";
import { University } from "../../universities/models/university";

export interface Artifact extends BaseEntity {
  isVerified: boolean;

  parent?: Artifact[];
  children?: Artifact[];
  relating?: Artifact[];
}

export interface SkillArtifact extends Artifact {
  skillType: SkillType;
  skillName: string;
}

export interface HardSkillArtifact extends SkillArtifact {
  subGroups: HardSkillSubGroup[];
}

export interface UserHardSkillArtifact extends HardSkillArtifact {
  proficiencyEstimation: ProficiencyLevel; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
  subGroups: HardSkillSubGroup[]; // Programming Languages, Frameworks & Libraries
  expirienceInMonths: number;
  expirienceInYears: number;
  startMonth: Date;
}

export interface SoftSkillArtifact extends SkillArtifact {

}

export interface ManagerialSkillArtifact extends SkillArtifact {

}

export interface UserSoftSkillArtifact extends SoftSkillArtifact {
  intensityEstimation: IntensityLevel; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
}

export interface UserManagerialSkillArtifact extends ManagerialSkillArtifact {
  level: ManagerialLevel
}

export interface DomainSkillArtifact extends SkillArtifact {

}
export interface UserDomainSkillArtifact extends SoftSkillArtifact {
  proficiencyEstimation: number; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
  expirienceInMonths: number;
  expirienceInYears: number;
}

export interface LanguagesArtifact extends SkillArtifact {
  languageSkillType: LanguageSkillType;
}

export interface UserLanguagesArtifact extends LanguagesArtifact {
  proficiencyEstimation: number; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
  expirienceInMonths: number;
  expirienceInYears: number;
}

export interface AcademicArtifact extends SkillArtifact {

  academicEducationLevelType: AcademicEducationLevelType;
  faculty?: string;
  institution?: EducationInstitution;
  fieldOfStudy?: string;
  specialication: string;
}

export interface UserAcademicArtifact extends AcademicArtifact {
  certificateNumber?: string;
  startStudyDate: Date;
  graduationDate: Date;
  currentlyStudying: boolean;
}

export interface OperationalExpirienceArtifact extends SkillArtifact {
  jobTitle: string;
  resposiblities: string[];
  skills: SkillArtifact[];
}

export interface UserOperationalExpirienceArtifact extends OperationalExpirienceArtifact {
  companyName: CompanyVersion | string;
  achievements: string[];
  startWorkDate: Date;
  endWorkDate: Date;
  isCurrent?: boolean;
  additionalInfo: string;
}

export interface CertificationArtifact extends SkillArtifact {
  certificationCenter: string;
}

export interface UserCertificationArtifact extends CertificationArtifact {
  description: string;
  certificateNumber: string;
  certificationDate: Date;
}

export class Skill implements SkillArtifact {
  _id?: any;
  skillType: SkillType = SkillType.other;

  skillName: string = '';
  isVerified: boolean = true;

  parent?: Artifact[];
  children?: Artifact[];
  relating?: Artifact[];
}

export class HardSkill extends Skill implements HardSkillArtifact {
  subGroups: HardSkillSubGroup[] = [];
  override skillType: SkillType = SkillType.hard;
}

export class UserHardSkill extends HardSkill implements UserHardSkillArtifact {
  proficiencyEstimation: ProficiencyLevel = ProficiencyLevel.Beginner;
  expirienceInMonths: number = 0;
  expirienceInYears: number = 0;
  startMonth!: Date;
}

export class SoftSkill extends Skill implements SoftSkillArtifact {
  override skillType: SkillType = SkillType.soft;
}

export class UserSoftSkill extends SoftSkill implements UserSoftSkillArtifact {
  intensityEstimation: IntensityLevel = IntensityLevel.VeryLow;
}
export class ManagerialSkill extends Skill implements ManagerialSkillArtifact {
  override skillType: SkillType = SkillType.managirial;
}

export class UserManagerialSkill extends ManagerialSkill implements UserManagerialSkillArtifact {
  level: ManagerialLevel = ManagerialLevel.Coordinator;
}

export class DomainSkill extends Skill implements DomainSkillArtifact {
  override skillType: SkillType = SkillType.domain;
}

export class UserDomainSkill extends DomainSkill implements UserDomainSkillArtifact {
  proficiencyEstimation: number = 0;
  expirienceInMonths: number = 0;
  expirienceInYears: number = 0;
}

export class LanguageSkill extends Skill implements LanguagesArtifact {
  override skillType: SkillType = SkillType.language;
  languageSkillType: LanguageSkillType = LanguageSkillType.general;
}

export class UserLanguageSkill extends LanguageSkill implements UserLanguagesArtifact {
  proficiencyEstimation: number = 0;
  expirienceInMonths: number = 0;
  expirienceInYears: number = 0;
}

export class AcademicEducation extends Skill implements AcademicArtifact {
  override skillType: SkillType = SkillType.academic;
  academicEducationLevelType: AcademicEducationLevelType = AcademicEducationLevelType.other;

  fieldOfStudy?: string = '';
  specialication: string = '';

  override skillName: string = this.specialication;
}

export class UserAcademicEducation extends AcademicEducation implements UserAcademicArtifact {
  certificateNumber?: string = '';
  institutionName: string = '';
  institution: EducationInstitution = new EducationInstitution();
  faculty?: string = '';
  startStudyDate: Date = new Date();
  graduationDate: Date = new Date();
  currentlyStudying: boolean = false;
}

export class EducationInstitution extends University {
  internationalName: string = '';
  location?: LocationPoint;
  rating?: string;
}

export class LocationPoint {
  lattitute: number = 0.0;
  longitude: number = 0.0;
}

export class Certification extends Skill implements CertificationArtifact {
  override skillType: SkillType = SkillType.certification;
  certificationCenter: string = '';
}

export class UserCertification extends Certification implements UserCertificationArtifact {
  description: string = '';
  certificateNumber: string = '';
  certificationDate: Date = new Date();
}

export class OperationalExpirience extends Skill implements OperationalExpirienceArtifact {
  override skillType: SkillType = SkillType.operationalExperience;
  jobTitle: string = '';
  resposiblities: string[] = [];
  skills: SkillArtifact[] = [];
}

export class UserOperationalExpirience extends OperationalExpirience implements UserOperationalExpirienceArtifact {
  companyName!: string;
  companyId?: any;
  company?: CompanyVersion;
  workExpirienceName: string = '';

  // technology: string = '';
  achievements: string[] = [];

  isCurrent?: boolean = false;

  startWorkDate: Date = new Date();
  endWorkDate: Date = new Date();

  additionalInfo: string = '';
}

export enum SkillType {
  hard = "Hard",
  soft = "Soft",
  managirial = "Managirial and Leadership",
  domain = "Domain",
  language = "Language",

  academic = "Academic",
  certification = "Certification",
  operationalExperience = "Operational Expirience",

  other = "Other"
}

export enum AcademicEducationLevelType {
  any = "Any",
  PE = "Primary education",
  LSE = "Lower secondary education",
  USE = "Upper secondary education",
  PDNTE = "Post-secondary non-tertiary education",
  SCTE = "Short-cycle tertiary education",
  BA = "Bachelor of Arts, Humanities and Social Sciences",
  BSc = "Bachelor of Sciences",
  BENG = "Bachelor of Engineering (Software, Robotics and Physics)",
  LLB = "Bachelor of Law",
  MA = "Masters of Arts, Humanities and Social Sciences",
  MSCI = "Masters of Sciences and Humanities",
  MBIOL = "Masters of Biology",
  MSc = "Masters of Sciences",
  MCOMP = "Masters of Computer Science",
  MENG = "Masters of Engineering",
  MMATH = "Masters of Mathematics",
  MPHYS = "Masters of Physics",
  MBA = "Masters of Business Administration",
  MPhil = "Masters of Philosophy: Advanced research Masters degree",
  MRes = "Masters of Research: Contains some taught and research elements",
  LLM = "Masters of Law",
  PhD = "Doctor of Philosophy",
  other = "Other"
}

export enum ManagirialSkillSubGroup {

}

export enum SoftSkillSubGroup {

}

export enum HardSkillSubGroup {
  'Programming Languages',
  'Frameworks & Libraries',
  'Databases',
  'Operating Systems',
  'Tools and IDEs',
  'Version Control',
  'Cloud Services',
  'Networking',
  'Security',
  'DevOps',
  'Data Science',
  'Machine Learning',
  'Mobile Development',
  'Web Development',
  'Embedded Systems',
  'Automation',
  'Testing and QA',
  'Game Development',
  'Artificial Intelligence',
  'Virtualization',
  'Big Data',
  'Internet of Things (IoT)',
  'Blockchain',
  'AR/VR',
  'Robotics',
  'System Administration',
};
//TODO:
export enum ManagerialLevel {
  //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Professional, Expert. Lead
  'Coordinator',
  'Lead',
  'Project',
  'Program',
  'Portfolio',
  'Director',
  'C-Level Oficer'
}

export enum LanguageSkillLevel {
  A0, A1, A2, B1, B2, C1, C2
}

export enum ProficiencyLevel {
  //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Professional, Expert. Lead

  Beginner = 'Beginner',
  Intern = 'Intern',
  Junior = 'Junior',
  Regular = 'Regular',
  Professional = 'Prof',
  Expert = 'Expert',
  Lead = 'Lead'
}

export enum IntensityLevel {
  VeryLow = 'Very Low',
  Low = 'Low',
  Lower = 'Lower',
  Normal = 'Normal',
  Higher = 'Higher',
  Strong = 'Strong',
  VeryHigh = 'Very High'
}

export enum LanguageSkillType {
  general = "General",
  listening = "Listening",
  speaking = "Speaking",
  reading = "Reading",
  writing = "Writing",
}