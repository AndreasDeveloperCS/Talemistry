import { AbstractControl } from "@angular/forms";

export class ContactForm {
  contactName?: AbstractControl<any, any>;
  company?: AbstractControl<any, any>;
  phone?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  message?: AbstractControl<any, any>;
}

export class ContactData {
  contactName: string = '';
  company: string = '';
  phone: string = '';
  mainEmail: string = '';
  email: string = '';
  message: string = '';
}

export interface LocationHeadquarter {
  country: string;
  city: string;
  address: string;
  phone: string;
  mainEmail: string;
  email: string;
}
