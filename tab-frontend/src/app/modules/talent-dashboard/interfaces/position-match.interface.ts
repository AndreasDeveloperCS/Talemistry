export interface PositionMatchResult {
    positionId: string;
    title: string;
    companyId: string;
    companyName: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchedSkillsCount: number;
    totalRequiredSkills: number;
}

export interface MatchingPositions {
  total: number;
  highMatch: number;
  mediumMatch: number;
  lowMatch: number;
}