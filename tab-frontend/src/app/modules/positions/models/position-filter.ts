
import { Skill } from "../../skills/models/skill";
import { CompensationTimeline, CooperationType, InvolevementType, JobType, WorkPlace } from "./position-details";

export class PositionFilters {
    
    excludePositionsWithoutSalarySpecification:boolean = false;
    minSalary: number = 0.0;
    maxSalary: number = Infinity;
    compensationTimeline:CompensationTimeline = CompensationTimeline.month;
    minExperience: number = 0;
    maxExperience: number = Infinity;
    jobType:JobType = JobType.any;
    workPlace:WorkPlace = WorkPlace.any;
    cooperationType:CooperationType = CooperationType.any;
    involevementType:InvolevementType =  InvolevementType.any;
    
    hardSkills:Skill[] = [];
    hardSkillsSearchingType:SearchingType = SearchingType.or;
    softSkills:Skill[]=[];
    softSkillsSearchingType:SearchingType = SearchingType.or;
    domainSkills:Skill[] = [];
    domainSkillsSearchingType:SearchingType = SearchingType.or;
    languages:Skill[]=[];
    languagesSearchingType:SearchingType = SearchingType.or;
    headquarterLocation: Location[]=[];
}

export enum SearchingType {
    or = "OR",
    and = "AND"
}

