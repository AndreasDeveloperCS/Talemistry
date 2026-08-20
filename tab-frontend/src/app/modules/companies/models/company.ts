
import { BaseEntity, OwnerEntity } from "../../general/models/base-entity";
import { Currency } from "../../general/models/currency";
import { FileData } from "../../general/models/file-data";
import { IndustryDomain } from "../../industries/models/industry";
import { City } from "../../location/models/city";
import { Country } from "../../location/models/country";
import { Address } from "../../positions/models/address";
import { ContactEmail, ContactPhone } from "../../positions/models/contact";
import { Manager } from "../../positions/models/manager";
import { CompanyBenefit } from "./company-benefits";
import { CompanyLogo } from "./company-logo";
import { CompanyValue } from "./company-values";

// To think more about items of this list
export enum RelationshipsType {
    potentialCustomer = 'Potential Customer',
    interestedInCooperation = 'Interested in Cooperation',
    customer = 'Customer',
    competitor = 'Competitor',
}

export class Headquarter extends Address {
    email: ContactEmail[] = [];
    phone: ContactPhone[] = [];
}

export class SizeRange {
    min: number = 0;
    max: number = 0;
}

export class CompanyData {

    companyName!: string;
    shortDescription!: string;
    industryCategories: IndustryDomain[] = [];
    mainIndustryDomain: IndustryDomain = this.industryCategories.length > 0 ? this.industryCategories[0] : new IndustryDomain();
    city?: City;
    country?: Country;
    logo?: any;
    companyLogo?: CompanyLogo;

    // Full form
    companySite?: string;
    companySizeRange?: SizeRange;
    companySize?: number;
    companyType?: string = '';
    companyRevenue?: number = 0;
    currency?: Currency = new Currency();
    registrationNumber?: string = '';
    taxNumber?: string = '';
    companyAddress?: Headquarter[] = [];
    companyEmail?: ContactEmail;
    companyPhone?: ContactPhone;
    managers?: Manager[] = [];

    // Details
    companyValues?: CompanyValue[] = [];
    companyBenefits?: CompanyBenefit[] = [];
}

export class CompanyVersion implements BaseEntity, OwnerEntity {
    _id?: any;
    userId: any;
    companyId?: any;
    version: number = 1;
    isVerified: boolean = false;
    data: CompanyData = new CompanyData();
    createdBy?: any;
    createdDate: Date = new Date();
    modifiedDate?: Date = new Date();
    modifiedBy?: any;
}

export class Company implements BaseEntity {
    _id?: any;

    userId: any;
    companyId?: any;
    version: number = 0;
    isVerified: boolean = false;

    data: CompanyData = new CompanyData();

    createdBy?: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}

export interface CompanyVersionDialogResult {
    companyInfo: CompanyData;
    fileData: FileData;
}