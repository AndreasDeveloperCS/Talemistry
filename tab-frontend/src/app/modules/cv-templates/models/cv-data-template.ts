import { ProficiencyLevel } from "../../skills/models/skill"

export interface CVDataTemplate {
  personalInfo: {
    firstName: string
    lastName: string
    photo?: string
    title: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
  }
  objective: string
  summary: string
  hardSkills: string[]
  softSkills: string[]
  domainSkills: string[]
  managerialSkills: string[]
  languages: Language[]
  education: Education[]
  certifications: Certification[]
  experience: Experience[]
  motivationalFactors: string[]
}

export interface Language {
  name: string
  level: string
}

export interface Education {
  degree: string
  institution: string
  year: string
  description?: string
}

export interface Certification {
  name: string
  issuer: string
  year: string
}

export interface Experience {
  title: string
  company: string
  period: string
  description: string
  achievements?: string[]
}

export enum ProficiencyLevelNumeric {
  Beginner = 1,
  Intern = 2,
  Junior = 3,
  Regular = 4,
  Professional = 5,
  Expert = 6,
  Lead = 7
}

export const PROFICIENCY_ORDER: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.Beginner]: 1,
  [ProficiencyLevel.Intern]: 2,
  [ProficiencyLevel.Junior]: 3,
  [ProficiencyLevel.Regular]: 4,
  [ProficiencyLevel.Professional]: 5,
  [ProficiencyLevel.Expert]: 6,
  [ProficiencyLevel.Lead]: 7,
};

export const MAX_PROFICIENCY_LEVEL = 7;

export const PROFICIENCY_LABEL_BY_NUMBER: Record<number, ProficiencyLevel> = {
  1: ProficiencyLevel.Beginner,
  2: ProficiencyLevel.Intern,
  3: ProficiencyLevel.Junior,
  4: ProficiencyLevel.Regular,
  5: ProficiencyLevel.Professional,
  6: ProficiencyLevel.Expert,
  7: ProficiencyLevel.Lead,
};
