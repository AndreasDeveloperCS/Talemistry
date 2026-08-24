import { CommunicationMean } from "../../communication/enums/communication-means.enum";
import { MotivationalFactor } from "../../motivational-factors/models/motivational-factor";
import { CompensationTimeline } from "../../positions/models/position-item";


export class CompensationExpectations {
    minimum:number = 0;
    comfort:number = 0;
    compensationTimline:CompensationTimeline = CompensationTimeline.month;
}

export class Preferences {
    constructor() {
        this.compensationPackage = new CompensationExpectations();
    }
    compensationPackage:CompensationExpectations = new CompensationExpectations();
    motivationalFactors:MotivationalFactor[] = [];
    onlyRemote:boolean = false;
    onlyPartTime:boolean = false;
}