import { FileInfo } from "../../cvs/models/file-info";
import { Manager } from "../../hiring-managers/models/manager";
import { City } from "../../locations/models/city";
import { Country } from "../../locations/models/countries";
import { Currency } from "../../locations/models/currency";
import { Headquarter, SizeRange } from "./company-artifacts";
import { CompanyBenefit } from "./company-benefits";
import { CompanyLogo } from "./company-logos";
import { CompanyValue } from "./company-values";
import { ContactEmail, ContactPhone } from "./contact";
import { IndustryDomain } from "./industry";

export class CompanyData {

    companyName: string;
    shortDescription: string;
    mainIndustryDomain: IndustryDomain;
    industryCategories?: IndustryDomain[] = [];
    city?: City;
    country?: Country;

    logo?: FileInfo;
    companyLogo: CompanyLogo;

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
    companyEmail?: ContactEmail[] = [];
    companyPhone?: ContactPhone[] = [];
    managers?: Manager[] = [];

    // Details

    companyValues?: CompanyValue[] = [];
    companyBenefits?: CompanyBenefit[] = [];
}