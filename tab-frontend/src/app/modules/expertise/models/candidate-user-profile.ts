import { User } from "../../authentication/models/user";
import { BaseEntity } from "../../general/models/base-entity";
import { Currency } from "../../general/models/currency";
import { City } from "../../location/models/city";
import { Country } from "../../location/models/country";
import { CompensationTimeline } from "../../positions/models/position-details";
import { Skill, UserAcademicEducation, UserCertification, UserDomainSkill, UserHardSkill, UserLanguageSkill, UserManagerialSkill, UserOperationalExpirience, UserSoftSkill } from "../../skills/models/skill";
import { UserSocialMedia } from "../../social-media/models/social-media";
import { MotivationalFactor } from "../../motivational-factors/models/motivational-factor";
import { DEFAULT_NOTIFICATION_PREFERENCES, MessageNotificationPreferences } from "../../communication/models/notification-channel";

export interface CoverLetter {
    dynamicGreetings: string;
    staticGreetings: string;
    content: string;
    priority: number;
    isMain: boolean;
    isNotDraft: boolean;
}
export class CompensationExpectations {

    private _minimum: number = 0;
    public get minimum(): number {
        return this._minimum;
    }

    public set minimum(value: number) {
        this._minimum = value;
        this.minimumMap = this.internalFunction(this.minimumMap, value, this.compensationTimline);
        // console.log(this.minimumMap);
    }

    private _comfort: number = 0;

    public get comfort(): number {
        return this._comfort;
    }

    public set comfort(value: number) {
        this._comfort = value;
        this.comfortMap = this.internalFunction(this.comfortMap, value, this.compensationTimline);
        // console.log(this.comfortMap);
    }

    compensationTimline: CompensationTimeline = CompensationTimeline.month;
    currency: Currency = new Currency();

    minimumMap: Map<CompensationTimeline, number> = new Map<CompensationTimeline, number>();
    comfortMap: Map<CompensationTimeline, number> = new Map<CompensationTimeline, number>();

    public internalFunction = (map: Map<CompensationTimeline, number>, value: number, timeline: CompensationTimeline) => {
        const conversionFactors: Record<CompensationTimeline, number> = {
            [CompensationTimeline.contract]: 1,
            [CompensationTimeline.annual]: 1,
            [CompensationTimeline.month]: 12,
            [CompensationTimeline.week]: 52,
            [CompensationTimeline.day]: 250,
            [CompensationTimeline.hour]: 2000,
        };

        if (!conversionFactors[timeline]) {
            console.error(`Invalid CompensationTimeline: ${timeline}`);
            return map;
        }

        const annualValue = value * conversionFactors[timeline];

        Object.keys(conversionFactors).forEach((key) => {
            const compTimeline = key as unknown as CompensationTimeline;
            const factor = conversionFactors[compTimeline];
            map.set(compTimeline, annualValue / factor);
        });

        return map;
    }

}
export class Preferences {
    constructor() {
        this.compensationPackage = new CompensationExpectations();
    }
    compensationPackage: CompensationExpectations = new CompensationExpectations();
    motivationalFactors: MotivationalFactor[] = [];
    onlyRemote: boolean = false;
}

export class LocationResidence {
    currentLocation: Country = new Country();
    taxResidence?: Country;
    currentCity: City = new City();
    locationPreference: Country[] = [];
    currentJobPermissions: Country[] = [];
}

export class CandidateUserProfile implements BaseEntity {
    _id?: any;

    constructor() {
        this.preferences = new Preferences();
    }

    userId: any;

    user: User = new User();

    isPublic?: boolean = false;
    pseudonym: string = '';
    targetPosition?: string;

    locationResidence: LocationResidence = new LocationResidence();
    preferences: Preferences = new Preferences();
    userSocialMediaList: UserSocialMedia[] = [];

    objective: string = '';
    summary: string = '';

    skills: Skill[] = [];

    hardSkills: UserHardSkill[] = [];
    softSkills: UserSoftSkill[] = [];
    managerialSkills: UserManagerialSkill[] = [];
    domainSkills: UserDomainSkill[] = [];
    languagesSkills: UserLanguageSkill[] = [];

    operationalExperience: UserOperationalExpirience[] = [];
    academicEducation: UserAcademicEducation[] = [];
    certification: UserCertification[] = [];

    additionalInformation: string = '';

    hobbies: string[] = [];
    coverLetters: CoverLetter[] = [];

    createdDate?: Date = new Date();
    modifiedDate?: Date;
}