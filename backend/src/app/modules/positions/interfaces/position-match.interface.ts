import { ObjectId } from "bson";

export interface PositionMatchResult {
    positionId: ObjectId;
    title: string;
    companyId: ObjectId;
    companyName: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchedSkillsCount: number;
    totalRequiredSkills: number;
}