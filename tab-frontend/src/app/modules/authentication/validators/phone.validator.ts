import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const phone = parsePhoneNumberFromString(control.value);

    if (!phone || !phone.isValid()) {
      return { invalidPhone: true };
    }

    return null;
  };
}