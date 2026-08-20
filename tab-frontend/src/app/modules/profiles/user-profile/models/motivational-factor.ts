import { BaseEntity } from "../../../general/models/base-entity";
import { IntensityLevel } from "../../../skills/models/skill";

export class MotivationalFactor implements BaseEntity {
    _id: any;
    factor: string = '';
    subgroups?: any[] = [];
    influenceStrength: IntensityLevel = IntensityLevel.Normal;
    isVerified: boolean = false;
    createdDate: Date = new Date();
    modifiedDate: Date = new Date();
}