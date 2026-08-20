import { OpenPosition } from "../models/position";
import { PositionDetails, GeneralDescription, ContractConditions, PositionRequirements, PositionStatus } from "../models/position-details";

export function getRequiredEducation(position: OpenPosition): string {
    return getPositionRequirements(position)?.requiredEducation
        && getPositionRequirements(position)?.requiredEducation?.length > 0
        ? getPositionRequirements(position)?.requiredEducation.map(c => c.education).join(', ')
        : '';
}

export function getRequiredCertification(position: OpenPosition): string {
    return getPositionRequirements(position)?.isRequiredCertification
        && getPositionRequirements(position)?.requiredCertification?.length > 0
        ? getPositionRequirements(position)?.requiredCertification.map(c => c.certification).join(', ')
        : '';
}

export function getPositionDetails(position: OpenPosition): PositionDetails {
    return position?.positionDetails
        ? position?.positionDetails
        : new PositionDetails();
}
export function getPositionGeneralDetails(position: OpenPosition): GeneralDescription {
    return position?.positionDetails?.general
        ? position?.positionDetails?.general
        : new GeneralDescription();
}
export function getContractConditions(position: OpenPosition): ContractConditions {
    return position?.positionDetails?.conditions
        ? position?.positionDetails?.conditions
        : new ContractConditions();
}
export function getSpecificRequirement(position: OpenPosition): string {
    return getPositionGeneralDetails(position)?.specificRequirements
        ? getPositionGeneralDetails(position)?.specificRequirements.join(', ')
        : '';
}
export function getPositionRequirements(position: OpenPosition): PositionRequirements {
    return position?.positionDetails?.requirements
        ? position?.positionDetails?.requirements
        : new PositionRequirements();
}
export function getSkills(position: OpenPosition) {
    return getPositionRequirements(position)?.positionSkills
        ? getPositionRequirements(position)?.positionSkills.map(skill => skill.skillName)
        : [];
}

export function getBenefitsList(position: OpenPosition) {
    return getContractConditions(position)?.benefits
        ? getContractConditions(position)?.benefits.map(benefit => benefit.benefit)
        : [];
}

export function getLocations(position: OpenPosition): string {
    return getPositionDetails(position)?.headquarterLocation
        ? getPositionDetails(position)?.headquarterLocation.map(location => location.name).join(', ')
        : '';
}

export function getCreationDate(position: OpenPosition): string {
    const rawDate = position?.createdDate ?? new Date();
    const date = new Date(rawDate); // convert string or date to Date object
    return isValidDate(date)
        ? date.toLocaleDateString('en-US', {
            month: 'short',  // e.g., "Jun"
            day: '2-digit',
            year: 'numeric'
        })
        : '';
}

export function isValidDate(date: any): boolean {
    const parsed = (date instanceof Date) ? date : new Date(date);
    return parsed instanceof Date && !isNaN(parsed.getTime());
}

export function getCompensationPackage(position: OpenPosition): string {
    return getContractConditions(position)?.budget?.maxBudgetAmount
        && getContractConditions(position)?.budget?.timeline
        ? `${getContractConditions(position)?.budget?.maxBudgetAmount?.toString()} ${getContractConditions(position).budget?.timeline}`
        : '';
}

export function getTitleCode(position: OpenPosition): string {
    return position?.titleCode ?? '(HRP-' + position?._id?.slice(-6)?.toUpperCase() + ')';
}

export function getStatus(position: OpenPosition): string {
    return position?.status;
}

export function getCompanyEmployees(position: OpenPosition): any {
    return getPositionDetails(position)?.company.data?.companySizeRange
        ? getPositionDetails(position)?.company?.data.companySizeRange?.toString()
        : '';
}

export function getShortDescription(position: OpenPosition): string {
    return position?.projectDescription?.sectionContent
        ? position?.projectDescription?.sectionContent
        : '';
}

export function getJobResponsibilities(position: OpenPosition): string {
    return position?.jobResponsibilities?.sectionContent
        ? position?.jobResponsibilities?.sectionContent
        : '';
}

export function getRequirements(position: OpenPosition): string {
    return position?.requirements?.sectionContent
        ? position?.requirements?.sectionContent
        : '';
}

export function getBenefits(position: OpenPosition): string {
    return position?.benefits?.sectionContent
        ? position?.benefits?.sectionContent
        : '';
}