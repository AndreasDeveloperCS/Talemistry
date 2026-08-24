import { User } from "../../authentication/models/user";
import { Company } from "../../companies/models/company";
import { ContactEmail, ContactPhone } from "./contact";

export class Manager extends User {
  position: string = '';
  department?: string = '';
  company: Company = new Company();
  mainEmail: ContactEmail = new ContactEmail(this.email);
  mainPhone: ContactPhone = new ContactPhone(this.phone);
  emails: ContactEmail[] = [];
  phones: ContactPhone[] = [];
}