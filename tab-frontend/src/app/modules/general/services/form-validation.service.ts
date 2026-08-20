import { Injectable } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor() { }

  getErrors(form: FormGroup, fieldName: string): ValidationErrors {
    return form.controls[fieldName]?.errors ?? { '': '' };
  }

  fieldIsValid(form: FormGroup, fieldName: string) {
    return form.controls[fieldName]?.invalid;
  }
}
