import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from '../../base/models/base';
import { CompanyVersion } from '../../companies/models/company-versions';

export interface Artifact {
  parent?: Artifact[];
  children?: Artifact[];
  relating?: Artifact[];
}

export interface SkillArtifact extends Artifact {
  skillType: SkillType;
  skillName: string;
}

export interface HardSkillArtifact extends SkillArtifact {
  subGroup: string;
}

export interface UserHardSkillArtifact extends HardSkillArtifact {
  proficiencyEstimation: PorficiencyLevel; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
  expirienceInMonths: number;
  expirienceInYears: number;
  startMonth: Date;
}

export interface SoftSkillArtifact extends SkillArtifact {

}

export interface UserSoftSkillArtifact extends SoftSkillArtifact {
  proficiencyEstimation: number; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
}

export interface DomainSkillArtifact extends SkillArtifact {

}
export interface UserDomainSkillArtifact extends SoftSkillArtifact {
  proficiencyEstimation: number; //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Preofessional, Expert. Lead
  expirienceInMonths: number;
  expirienceInYears: number;
}

export interface ManagerialSkillArtifact extends SkillArtifact {

}

export interface UserManagerialSkillArtifact extends SoftSkillArtifact {
  proficiencyEstimation: number;
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
  companyName: string;
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

@Schema({ collection: 'skills' })
@Entity("skills")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class Skill implements SkillArtifact, IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

  constructor() { }

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: false, default: "" })
  skillType: SkillType = SkillType.other;

  @Column()
  @Prop({ required: false, default: "" })
  skillName: string = '';

  @Column()
  @Prop({ required: false, default: false })
  isVerified: boolean = true;

  @Prop({ required: false, default: [] })
  parent?: SkillArtifact[];

  @Column()
  @Prop({ required: false, default: [] })
  children?: SkillArtifact[];

  @Prop({ required: false, default: [] })
  relating?: SkillArtifact[];

  @Column()
  @Prop({ required: true, default: new Date(Date.now()) })
  dateTimeCreated?: Date = new Date();

  @Column()
  @Prop({ required: false })
  dateTimeModified?: Date;

  @Column()
  @Prop({ required: true })
  createdBy: ObjectId;

  @Column()
  @Prop({ required: true, default: new Date(Date.now()) })
  createdDate: Date;

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ required: false })
  modifiedDate?: Date;
}

export type SkillDocument = Skill & Document;

export const SkillSchema = SchemaFactory.createForClass(Skill);


export class HardSkill extends Skill implements HardSkillArtifact {
  override skillType: SkillType = SkillType.hard;
  subGroup: string = '';
}

export class UserHardSkill extends HardSkill implements UserHardSkillArtifact {
  proficiencyEstimation: PorficiencyLevel = PorficiencyLevel.beginner;
  expirienceInMonths: number = 0;
  expirienceInYears: number = 0;
  startMonth!: Date;
}

export class SoftSkill extends Skill implements SoftSkillArtifact {
  override skillType: SkillType = SkillType.soft;
}

export class UserSoftSkill extends SoftSkill implements UserSoftSkillArtifact {
  proficiencyEstimation: number = 0;
}

export class DomainSkill extends Skill implements DomainSkillArtifact {
  override skillType: SkillType = SkillType.domain;
}

export class UserDomainSkill extends DomainSkill implements UserDomainSkillArtifact {
  proficiencyEstimation: number = 0;
  expirienceInMonths: number = 0;
  expirienceInYears: number = 0;
}

export class ManagerialSkill extends Skill implements ManagerialSkillArtifact {
  override skillType: SkillType = SkillType.managirial;
}

export class UserManagerialSkill extends ManagerialSkill implements UserManagerialSkillArtifact {
  proficiencyEstimation: number = 0;
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
  certificateNumber?: string;

  institution: EducationInstitution = new EducationInstitution();
  faculty?: string;
  startStudyDate: Date = new Date();
  graduationDate: Date = new Date();
  currentlyStudying: boolean = false;
}

export class EducationInstitution {
  name: string = '';
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
  jobTitle: string = '';
  resposiblities: string[] = [];
  skills: SkillArtifact[] = [];
}

export class UserOperationalExpirience extends OperationalExpirience implements UserOperationalExpirienceArtifact {
  companyName: string = '';
  companyId?: ObjectId;
  company?: CompanyVersion;

  workExpirienceName: string = '';

  // technology: string = '';
  achievements: string[] = [];
  isCurrent?: boolean = false;
  startWorkDate: Date = new Date();
  endWorkDate: Date = new Date();
  additionalInfo: string = '';
}

export type UserOperationalExpirienceDocument = UserOperationalExpirience & Document;

export const UserOperationalExpirienceSchema = SchemaFactory.createForClass(UserOperationalExpirience);

export enum SkillType {
  hard = "Hard",
  soft = "Soft",
  managirial = "Managirial",
  domain = "Domain",
  language = "Language",

  academic = "Academic",
  certification = "Certification",
  operationalExperience = "Operational Expirience",

  other = "Other"
}

export enum AcademicEducationLevelType {
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

export enum PorficiencyLevel {
  //0-7 or A0 - A1, A2, B1, B2, C1, C2 or Beginner, Intern, Junior, Regular, Professional, Expert. Lead
  beginner = 'Beginner',
  intern = 'Intern',
  junior = 'Junior',
  regular = 'Regular',
  professional = 'Prof',
  expert = 'Expert',
  lead = 'Lead'
}

export enum LanguageSkillType {
  general = "General",
  listening = "Listening",
  speaking = "Speaking",
  reading = "Reading",
  writing = "Writing",
}

// TODO: We need to move it into other file resposnsible for the position requirements specification and interview tasks generation

export enum SkillImportance { // Based on MSCW framework “must-have,” “should-have,” “could-have,” and “won’t-have 
  mandatory = "Mandatory",          // 100%
  desired = "Desired",              // 75%
  niceToHave = "Nice to Have",     // 50% 
  optional = "Optional",           // 25% 
}

export class PositionSkill {
  skill?: SkillArtifact;
  weightedCoefficient?: number = 1;  // 1, 0.75, 0.5, 0.25
  skillImportance: SkillImportance = SkillImportance.mandatory;
}

export class Task {
  _id?: string;
  type?: string;
  targetSkill?: string;
  targetSkillId?: string;
  skill?: Skill;
  title?: string;
  description?: string;
}

export class InterviewTask {
  _id?: string;
  taskId?: string;
  task?: Task;
  answer?: string;
  assessment?: string;
  scorePercent?: number;
}

export class Benefit {
  _id?: any;
  id?: string;
  companyBenefit: string = '';
} 
