import { EntityLocation } from "./locations";

export class Address extends EntityLocation {
    street: string = '';
    buildingNumber: string = '';
    officeNumber: string = '';
    zip: string = '';
    isValid: boolean = false;
}