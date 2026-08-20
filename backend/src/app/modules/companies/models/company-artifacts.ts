import { Address } from "./address";
import { ContactEmail, ContactPhone } from "./contact";


export class Headquarter extends Address {
    email: ContactEmail[] = [];
    phone: ContactPhone[] = [];
}

export enum RelationshipsType {
    potentialCustomer = 'Potential Customer',
    interestedInCooperation = 'Interested in Cooperation',
    customer = 'Customer',
    competitor = 'Competitor',
}

export class SizeRange {
    min: number = 0;
    max: number = 0;
}
