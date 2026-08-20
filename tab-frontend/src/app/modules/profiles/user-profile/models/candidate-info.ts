import { AbstractControl } from "@angular/forms";

export class CandidateInfoForm {
  firstname?: AbstractControl<any, any>;
  lastname?: AbstractControl<any, any>;
  phone?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  coverLetterText?: AbstractControl<any, any>;
  recaptcha?: AbstractControl<any, any>;
  comment?: AbstractControl<any, any>;
}

export class CandidateInfoData {
  firstname: string = '';
  lastname: string = '';
  email: string = '';
  phone: string = '';
  coverLetterText?: string = '';
  coverLetterAttachments?: [] = [];
  recaptcha?: string = '';
  comment?: string = '';
}