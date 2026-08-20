import { BaseEntity } from "../../general/models/base-entity";
import { IntensityLevel } from "../../skills/models/skill";


export class MotivationalFactor implements BaseEntity {
    _id?: any;
    factor: string = '';
    subgroups?: any[] = [];
    influenceStrength: IntensityLevel = IntensityLevel.Normal;
    isVerified: boolean = false;
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date = new Date();
}