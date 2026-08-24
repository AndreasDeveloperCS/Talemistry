import { JourneyStage, WorkStyleType } from '../../../common/journey';
export declare class TalentElementDto {
    key: string;
    label: string;
    score: number;
}
export declare class VerifiedSkillDto {
    name: string;
    level: number;
    verified?: boolean;
    source?: string;
}
export declare class CreateCandidateDto {
    name: string;
    title: string;
    location?: string;
    email?: string;
    phone?: string;
    yearsExperience?: number;
    matchScore: number;
    elements?: TalentElementDto[];
    skills?: VerifiedSkillDto[];
    stage?: JourneyStage;
    workStyleType?: WorkStyleType;
    tags?: string[];
    summary?: string;
    avatarTone?: string;
    potentialSpectrum?: number;
}
declare const UpdateCandidateDto_base: import("@nestjs/common").Type<Partial<CreateCandidateDto>>;
export declare class UpdateCandidateDto extends UpdateCandidateDto_base {
}
export declare class QueryCandidateDto {
    q?: string;
    stage?: JourneyStage;
    minMatch?: number;
    page?: number;
    limit?: number;
}
export {};
