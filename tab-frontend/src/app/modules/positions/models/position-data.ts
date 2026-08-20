import { IndustryDomain } from "../../industries/models/industry";
import { getPositionDetails, getPositionRequirements, getContractConditions, getLocations, getPositionGeneralDetails, getSpecificRequirement, getBenefitsList, getRequiredEducation, getRequiredCertification, getSkills, getCompensationPackage, getCreationDate, getTitleCode, getCompanyEmployees, getShortDescription, getJobResponsibilities, getRequirements, getBenefits, getStatus } from "../shared-functions/shared-functions";
import { OpenPosition } from "./position";

export class PositionData {
    _position: OpenPosition;

    constructor(position: OpenPosition) {
        this._position = position;
    }

    get position(): OpenPosition {
        return this._position;
    }

    get positionId(): string {
        return this.position?._id ?? '';
    }

    get companyId(): string {
        return getPositionDetails(this.position)?.company?._id ?? '';
    }

    get companyName(): string {
        return getPositionDetails(this.position)?.company?.data?.companyName ?? ('');
    }

    get companyEmployees(): string {
        return getCompanyEmployees(this.position)?.company?.data?.companySize ?? '';
    }

    get companyIndustry(): string | IndustryDomain {
        return getPositionDetails(this.position)?.company?.data?.mainIndustryDomain?.industryName.toString() ?? '';
    }

    get companyAddress(): string {
        return getPositionDetails(this.position)?.company?.data?.companyAddress?.toString() ?? '';
    }

    get companyHeadquarter(): string {
        const locations = getPositionDetails(this.position)?.headquarterLocation;

        return Array.isArray(locations)
            ? locations.map(loc => loc.name).join(', ')
            : '';
    }

    get proficiencyLevel(): string {
        return getPositionRequirements(this.position)?.proficiencyLevel ?? '';
    }

    get cooperationType(): string {
        return getContractConditions(this.position)?.cooperationType ?? '';
    }

    get involvementType(): string {
        return getContractConditions(this.position)?.involevementType ?? '';
    }
    get locations(): string {
        return getLocations(this.position);
    }

    get workPlace(): string {
        return getPositionGeneralDetails(this.position)?.workPlace ?? '';
    }

    get jobType(): string {
        return getContractConditions(this.position)?.jobType ?? '';
    }

    get specificRequirements(): string {
        return getSpecificRequirement(this.position);
    }

    get benefitsList(): string[] {
        return getBenefitsList(this.position);
    }

    get requiredEducation(): string {
        return getRequiredEducation(this.position);
    }

    get requiredCertification(): string {
        return getRequiredCertification(this.position);
    }

    get positionSkillsList(): string[] {
        return getSkills(this.position);
    }

    get compensationPackage(): string {
        return getCompensationPackage(this.position);
    }

    get creationDate(): string {
        return getCreationDate(this.position);
    }

    get titleCode(): string {
        return getTitleCode(this.position);
    }

    get status(): string {
        return getStatus(this.position);
    }

    get positionTitle(): string {
        return this.position?.title;
    }

    get shortDescription(): string {
        return getShortDescription(this.position);
    }

    get jobResponsibilities(): string {
        return getJobResponsibilities(this.position);
    }

    get requirements(): string {
        return getRequirements(this.position);
    }

    get benefits(): string {
        return getBenefits(this.position);
    }
}
