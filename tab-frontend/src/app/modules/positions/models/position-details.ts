
// TODO: We need to move it into other file resposnsible for the position requirements specification and interview tasks generation

import { CompanyVersion } from "../../companies/models/company";
import { ProficiencyLevel, Skill, SkillArtifact } from "../../skills/models/skill";
import { PositionLocation } from "./location";
import { Manager } from "./manager";
import { TabItem } from "./position";
import { PositionBenefit } from "../../position-benefits/models/position-benefit";
import { PositionCertification } from "./position-certification";
import { PositionEducation } from "./position-education";

export enum JobType {
    any = 'Any',
    fullTime = 'Full Time',
    partTime = 'Part Time',
    projectType = 'Project',
    contract = 'Contract',
    task = 'Task',
    conculting = 'Conculting',
    internship = "Internship",
}

export enum CompensationTimeline {
    hour = 'Per Hour',
    day = 'Per Day',
    week = 'Per Week',
    month = 'Per Month',
    annual = 'Per Year',
    contract = 'Per Contract',
}

export enum WorkPlace {
    any = "Any",
    office = "Office",
    remote = "Remote",
    hybrid = "Hybrid"
}

export enum CooperationType {
    any = "Any",
    staff = 'Employment Staffing',
    b2b = 'B2B'
}

export enum InvolevementType {
    any = 'Any',
    inHouse = 'In-House',
    outsource = 'Outsource',
    outstaff = 'Outstaff'
}

export enum PositionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

export class Budget {

    timeline: CompensationTimeline = CompensationTimeline.month;

    maxBudgetAmount: number = 0;

    annualBudget: number = this.calcateAnnualBudget(this.maxBudgetAmount, this.timeline);

    calcateAnnualBudget(maxBudgetAmount: number, timeline: CompensationTimeline): number {
        switch (timeline) {
            case CompensationTimeline.annual:
                return maxBudgetAmount;
            case CompensationTimeline.month:
                return maxBudgetAmount * 12;
            case CompensationTimeline.week:
                return maxBudgetAmount * 52;
            case CompensationTimeline.day:
                return maxBudgetAmount * 250;
            case CompensationTimeline.hour:
                return maxBudgetAmount * 2000;
            case CompensationTimeline.contract:
                return maxBudgetAmount;
        }
    }
}

export enum ContractType {
    timeAndMaterial = "Time and Material",
    fixedPrice = "Fixed Price",
    feeBased = "Fee Based"
}

export class ContractConditions {
    constructor() {
        this.budget = new Budget();
    }

    cooperationType: CooperationType = CooperationType.b2b;
    contractType?: ContractType = ContractType.timeAndMaterial;
    budget: Budget = new Budget();
    contractMonthDuration?: number = 0;
    isIndefinitedDuration: boolean = false;
    jobType: JobType = JobType.fullTime;
    involevementType: InvolevementType = InvolevementType.outsource;
    benefits: PositionBenefit[] = [];
}

export enum SpecificRequirement {
    disabilities = "Person with disabilities",
    veterans = "Veteran",
    retired = "Retired"
}

export enum SkillImportance { // Based on MSCW framework “must-have,” “should-have,” “could-have,” and “won’t-have 
    mandatory = "100%",          // Mandatory - 100%
    desired = "75%",              // Desired - 75%
    niceToHave = "50%",     // Nice to Have - 50% 
    optional = "25%",           // Optional - 25% 
}

export function skillImportanceConverter(skillImportance: SkillImportance): string {
    switch (skillImportance) {
        case SkillImportance.mandatory:
            return 'Mandatory';
        case SkillImportance.desired:
            return 'Desired';
        case SkillImportance.niceToHave:
            return 'Nice to Have';
        case SkillImportance.optional:
            return 'Optional';
        default:
            return 'Is not required';
    }
}

export class PositionSkill extends Skill {

    proficiencyLevel?: ProficiencyLevel = ProficiencyLevel.Professional;

    private _weightedCoefficient?: number | undefined = 1;  // 1, 0.75, 0.5, 0.25

    public get weightedCoefficient(): number {
        return this.getWeightedCoefficient(this.skillImportance);
    }

    public set weightedCoefficient(value: number) {
        this._weightedCoefficient = value;
    }

    skillImportance: SkillImportance = SkillImportance.mandatory;

    private getWeightedCoefficient(skillImportance: SkillImportance): number {

        switch (skillImportance) {
            case SkillImportance.mandatory:
                return 1;
            case SkillImportance.desired:
                return 0.75;
            case SkillImportance.niceToHave:
                return 0.5;
            case SkillImportance.optional:
                return 0.25;
            default:
                return 0;
        }

    }
}

export class GeneralDescription {
    // proficiencyLevel: ProficiencyLevel = ProficiencyLevel.Regular;

    workPlace: WorkPlace = WorkPlace.remote;

    specificRequirements: SpecificRequirement[] = [];
}

export class PositionRequirements {
    proficiencyLevel: ProficiencyLevel = ProficiencyLevel.Regular;

    positionSkills: PositionSkill[] = [];
    requirementsSection?: string = '';
    skillWeigtedMap?: Map<SkillArtifact, number> = new Map<SkillArtifact, number>();

    isRequiredEducation: boolean = false;
    isRequiredCertification: boolean = false;

    // requiredEducation:AcademicEducationLevelType[] = [];
    requiredEducation: PositionEducation[] = [];
    requiredCertification: PositionCertification[] = [];
}

export class PositionDetails implements TabItem {
    sectionKey: string = 'Details';
    sectionName: string = 'Details';
    orderId: number = 0;

    company: CompanyVersion = new CompanyVersion();
    headquarterLocation: PositionLocation[] = [];
    mainHiringManager: Manager = new Manager();
    //hiringManagers: Manager[] | string[] = [];
    hiringManagers: string[] = [];

    general: GeneralDescription = new GeneralDescription();
    requirements: PositionRequirements = new PositionRequirements();
    conditions: ContractConditions = new ContractConditions();

    benefits: PositionBenefit[] = [];
    benefitsSection: string = '';
    additionalInfo: string = '';
}
