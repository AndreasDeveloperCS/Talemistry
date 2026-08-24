
export enum ROLES {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  CUSTOMERMANAGER = 'CUSTOMERMANAGER',
  STAKEHOLDER = 'STAKEHOLDER',
  TALENT = 'TALENT',
  INTERVIEWER = 'INTERVIEWER',
  RC = 'RC',
  RECRUITMENT = 'RECRUITMENT',
  GENERAL = 'GENERAL',
  //
  SA = 'SA',
  HR = 'HR',
  HM = 'HM'
}

export enum ROLES_ICONS {
  TALENT = "account_circle",
  RECRUITER = "supervisor_account",
}

export enum SignUpRoleGroup {
  RECRUITMENT = "RECRUITMENT",
  TALENT = "TALENT"
}

export enum RECRUITMENTROLES {
  HM = "HM",
  SE = "SE",
  HR = "HR",
  HH = "HH",
  RC = "RC"
}

export enum TALENTROLES {
  TJA = "TJA",
  TJAM = "TJAM",
  TJASME = "TJASME",
}

export enum RECRUITMENTROLES_ICONS {
  HM = "business_center",
  SE = "question_answer",
  HR = "group",
  HH = "travel_explore",
  RC = "person_search"
}

export enum TALENTROLES_ICONS {
  TJA = "account_circle",
  TJAM = "manage_accounts", //group_work
  TJASME = "lightbulb"
}

export enum ROLEGROUP_ICONS {
  RECRUITMENT = "supervisor_account",
  TALENT = "assignment_ind"
}

export enum RECRUITMENTROLEDESCRIPTIONS {
  HM = "Hiring Manager: Decision Maker | Offer sending | Final Managirial Evaluation",
  SE = "Interviewer: Skills Evaluation | Subject Expert",
  HR = "Human Resources: Onboarding Process | Offer sending",
  RC = "Recruiter: Reference Sharing for Bonus",
  HH = "Head Hunting: Job Opening | Pipeline filtering | Basic Condition Clarificaiton"
}

export enum TALENTROLEDESCRIPTIONS {
  TJA = "Talent | Job Applicant",
  TJAM = "Talent | Job Applicant | Manager",
  TJASME = "Talent | Job Applicant | Subject Expert",
}

export enum RoleGroup {
  SA = 1,
  ADMIN = 2,

  CRM = 4,
  MD = 8,

  LD = 16,
  CS = 128,

  HM = 256,
  HR = 256,

  RR = 512,
  HH = 512,
  SE = 1024,

  JA = 2048,
  CANDIDATE = 2048,
  Visitor = 4096
}

export enum ACCESSTYPES {
  R = 1,      // Read Only
  W = 2,      // Write Access (create/edit)
  RR = 4,     // Extended Read (e.g., read logs, audit history)
  WW = 8      // Full Write (create/edit/delete)
}