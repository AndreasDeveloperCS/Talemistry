import { UserOperationalExpirience } from "../../skills/models/skill";

export enum NewTemplateType {
  ExecutiveInfographic = 'executive-infographic',
  MagazineEditorial = 'magazine-editorial',
  HexagonTech = 'hexagon-tech',
  SplitAccent = 'split-accent',
}

export interface CandidateUserProfile {
  userId?: string | null;
  isPublic?: boolean;
  pseudonym?: string;
  targetPosition: string;
  user: UserInfo;
  preferences?: any;
  locationResidence?: LocationResidence;
  userSocialMediaList?: SocialMedia[];
  objective?: string;
  summary: string;
  skills?: any[];
  hardSkills: HardSkill[];
  softSkills: SoftSkill[];
  managerialSkills?: ManagerialSkill[];
  domainSkills: DomainSkill[];
  languagesSkills: LanguageSkill[];
  operationalExperience: UserOperationalExpirience[];
  academicEducation: AcademicEducation[];
  certification: Certification[];
  additionalInformation?: string;
  hobbies?: any[];
  coverLetters?: any[];
}

export interface UserInfo {
  _id?: string;
  firstname: string;
  lastname: string;
  fullName: string;
  email: string;
  phone?: string;
  photo?: string;
  createdDate?: Date;
}

export interface LocationResidence {
  city?: string;
  country?: string;
}

export interface SocialMedia {
  platform: string;
  url: string;
}

export interface HardSkill {
  skillName: string;
  skillType?: string;
  expirienceInMonths?: number;
  expirienceInYears?: number;
  proficiencyEstimation: number;
  startMonth?: Date;
  isVerified?: boolean;
  subGroups?: any[];
}

export interface SoftSkill {
  skillName: string;
  skillType?: string;
  isVerified?: boolean;
  intensityEstimation?: number;
}

export interface ManagerialSkill {
  skillName: string;
  skillType?: string;
  isVerified?: boolean;
  level?: number;
}

export interface DomainSkill {
  skillName: string;
  skillType?: string;
  isVerified?: boolean;
  expirienceInMonths?: number;
  expirienceInYears?: number;
  proficiencyEstimation?: number;
}

export interface LanguageSkill {
  skillName: string;
  skillType?: string;
  languageSkillType?: string;
  isVerified?: boolean;
  expirienceInMonths?: number;
  expirienceInYears?: number;
  proficiencyEstimation: number;
}

export interface AcademicEducation {
  specialication: string;
  certificateNumber?: string;
  currentlyStudying?: boolean;
  startStudyDate: Date | string;
  fieldOfStudy?: string;
  graduationDate: Date | string;
  skillType?: string;
  skillName?: string;
  institutionName: string;
  academicEducationLevelType: string;
  isVerified?: boolean;
  institution?: any;
}

export interface Certification {
  skillName: string;
  skillType?: string;
  description?: string;
  certificateNumber?: string;
  certificationCenter: string;
  certificationDate: Date | string;
  isVerified?: boolean;
}

// Utility functions
export function getProficiencyLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Upper Intermediate',
    5: 'Advanced',
    6: 'Expert',
  };
  return labels[level] || 'Unknown';
}

export function getLanguageProficiency(level: number): string {
  const labels: Record<number, string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Upper Intermediate',
    5: 'Advanced',
    6: 'Proficient',
  };
  return labels[level] || 'Unknown';
}

export function getShortProficiencyLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Beg',
    2: 'Elem',
    3: 'Int',
    4: 'Upp',
    5: 'Adv',
    6: 'Exp',
  };
  return labels[level] || '?';
}

export function formatDate(dateStr: Date | string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getEducationDegree(type: string): string {
  const degrees: Record<string, string> = {
    'PhD': 'Doctor of Philosophy',
    'MBA': 'Master of Business Administration',
    'MSc': 'Master of Science',
    'MA': 'Master of Arts',
    'BSc': 'Bachelor of Science',
    'BA': 'Bachelor of Arts',
    'Associate': 'Associate Degree',
    'Diploma': 'Diploma',
    'Certificate': 'Certificate',
  };
  return degrees[type] || type;
}