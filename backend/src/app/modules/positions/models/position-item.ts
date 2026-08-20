import { Column } from "typeorm";
import { IBaseModel } from "../../base/models/base";
import { CompanyVersion } from "../../companies/models/company-versions";
import { Manager } from "../../hiring-managers/models/manager";
import { Country } from "../../locations/models/countries";
import { PositionBenefit } from "../../position-benefits/models/position-benefit";
import { Skill, SkillArtifact } from "../../skills/models/skill";

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

export enum ContractType {
    timeAndMaterial = "Time and Material",
    fixedPrice = "Fixed Price",
    feeBased = "Fee Based"
}

export enum SpecificRequirement {
    disabilities = "Person with disabilities",
    veterans = "Veteran",
    retired = "Retired"
}

export enum WorkInvolvement {
    fullTime = "FullTime",
    partTime = "PartTime",
    contract = "Contract",
    internship = "Internship"
}

export enum SkillImportance { // Based on MSCW framework “must-have,” “should-have,” “could-have,” and “won’t-have 
    mandatory = "Mandatory - 100%",          // 100%
    desired = "Desired - 75%",              // 75%
    niceToHave = "Nice to Have - 50%",     // 50% 
    optional = "Optional - 25%",           // 25% 
}

export enum PositionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  DRAFT = 'draft'
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

export interface IPositionItem {
    key?: string;
    sectionKey?: string;
    sectionName?: string;
    sectionContent?: string;
    isIncluded?: boolean;
    orderId?: number;
}

export class PositionItem implements IPositionItem {
    @Column()
    key?: string = '';
    @Column()
    sectionKey?: string = '';
    @Column()
    sectionName?: string = '';
    @Column()
    sectionContent?: string = '';
    @Column()
    isIncluded?: boolean = true;
    @Column()
    orderId?: number = 0;
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

export class PositionBudget {
    min!: number;
    max!: number;
}

export interface IContractConditions {
    cooperationType: CooperationType;
    contractType?: ContractType;
    budget: Budget;
    contractMonthDuration?: number;
    isIndefinitedDuration: boolean;
    jobType: JobType;
    involevementType: InvolevementType;
    benefits: PositionBenefit[];
}

export class ContractConditions implements IContractConditions {
    @Column()
    cooperationType: CooperationType = CooperationType.b2b;
    @Column()
    contractType?: ContractType = ContractType.timeAndMaterial;
    @Column()
    budget: Budget = new Budget();
    @Column()
    contractMonthDuration?: number = 0;
    @Column()
    isIndefinitedDuration: boolean = false;
    @Column()
    jobType: JobType = JobType.fullTime;
    @Column()
    involevementType: InvolevementType = InvolevementType.outsource;
    @Column()
    benefits: PositionBenefit[] = [];
}

export class PositionSkill extends Skill {

    proficiencyLevel?: ProficiencyLevel = ProficiencyLevel.Professional;

    private _weightedCoefficient?: number | undefined = 1;  // 1, 0.75, 0.5, 0.25
    public get weightedCoefficient(): number | undefined {
        return this.getWeightedCoefficient(this.skillImportance);
    }
    public set weightedCoefficient(value: number | undefined) {
        this._weightedCoefficient = value;
    }

    skillImportance: SkillImportance = SkillImportance.mandatory;

    getWeightedCoefficient(skillImportance: SkillImportance) {

        switch (skillImportance) {
            case SkillImportance.mandatory:
                return 1;
            case SkillImportance.desired:
                return 0.75;
            case SkillImportance.niceToHave:
                return 0.5;
            case SkillImportance.optional:
                return 0.25;
        }

    }
}

export class PositionEducation implements IBaseModel {
    _id?: any;
    education: string = '';
    subgroups?: any[] = [];
    isVerified: boolean = false;
    dateTimeCreated: Date = new Date();
    dateTimeModified?: Date;
}

export class PositionCertification implements IBaseModel {
    _id?: any;
    certification: string = '';
    subgroups?: any[] = [];
    isVerified: boolean = false;
    dateTimeCreated: Date = new Date();
    dateTimeModified?: Date;
}

export interface IGeneralDescription {
    proficiencyLevel: ProficiencyLevel;
    workPlace: WorkPlace;
    specificRequirements;
}

export class GeneralDescription implements IGeneralDescription {
    @Column()
    proficiencyLevel: ProficiencyLevel = ProficiencyLevel.Regular;
    @Column()
    workPlace: WorkPlace = WorkPlace.remote;
    @Column()
    specificRequirements: SpecificRequirement[] = [];
}

export interface IPositionRequirements {
    proficiencyLevel: ProficiencyLevel;
    positionSkills: PositionSkill[];
    requirementsSection?: string;
    skillWeigtedMap?: Map<SkillArtifact, number>;

    isRequiredEducation: boolean;
    isRequiredCertification: boolean;

    requiredEducation: PositionEducation[];
    requiredCertification: PositionCertification[];
}

export class PositionRequirements implements IPositionRequirements {
    @Column()
    proficiencyLevel: ProficiencyLevel = ProficiencyLevel.Regular;
    @Column()
    positionSkills: PositionSkill[] = [];
    @Column()
    requirementsSection?: string = '';
    @Column()
    skillWeigtedMap?: Map<SkillArtifact, number> = new Map<SkillArtifact, number>();

    @Column()
    isRequiredEducation: boolean = false;
    @Column()
    isRequiredCertification: boolean = false;

    @Column()
    requiredEducation: PositionEducation[] = [];
    @Column()
    requiredCertification: PositionCertification[] = [];
}

export interface TabItem {
    sectionKey: string
    orderId: number;
    sectionContent?: string;
    sectionName?: string;
    isIncluded?: boolean;
}

export class PositionDetails implements TabItem {

    @Column()
    sectionKey: string = 'Details';

    @Column()
    sectionName: string = 'Details';

    @Column()
    orderId: number = 0;

    @Column()
    company: CompanyVersion = new CompanyVersion();

    @Column()
    headquarterLocation: Country[] = [];

    @Column()
    mainHiringManager: Manager = new Manager();

    @Column()
    hiringManagers: string[] = [];
    //hiringManagers: Manager[] | string[] = [];

    @Column()
    general: GeneralDescription = new GeneralDescription();

    @Column()
    requirements: PositionRequirements = new PositionRequirements();

    @Column()
    conditions: ContractConditions = new ContractConditions();

    @Column()
    benefits: PositionBenefit[] = [];

    @Column()
    benefitsSection: string = '';

    @Column()
    additionalInfo: string = '';
}

export class PositionRequirement extends PositionItem {
    override sectionName: string = 'Requirements';
    override sectionKey: string = 'PositionRequirements';
    requirementSections: PositionItem[] = [
        getItem('Mandatory requirements', 0),
        getItem('Desired skills and knowledge', 1),
        getItem('Extra Points', 2),
        getItem('Nice to have', 3)
    ];
}

export class ProjectDescription extends PositionItem {
    override sectionName: string = 'Short Project Description';
    override sectionKey: string = 'ShortProjectDescription';
}

export class JobResponsibilities extends PositionItem {
    override sectionName: string = 'Job Responsibilities';
    override sectionKey: string = 'JobResponsibilities';
}

export class PositionBenefits extends PositionItem {
    override sectionName: string = 'Benefits';
    override sectionKey: string = 'Benefits';
}

export class PositionSummary extends PositionItem {
    override sectionName: string = 'Summary';
    override sectionKey: string = 'Summary';
    summarySections: PositionItem[] = [];
}

export function getItem(section: string, order: number): PositionItem {
    const item: PositionItem = new PositionItem();
    item.sectionName = section;
    item.sectionKey = section
        .replace(' ', '')
        .replace(' ', '')
        .replace('""', '');
    item.sectionContent = '';
    item.isIncluded = true;
    item.orderId = order;
    return item;
}