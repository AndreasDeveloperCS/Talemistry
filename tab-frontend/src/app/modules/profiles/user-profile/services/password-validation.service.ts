import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class PasswordValidationService {

  constructor() {}

  
  createPasswordValidator(minLength: number): ValidatorFn[] {
    return [
      Validators.minLength(minLength),
      this.uppercaseValidator(),
      this.lowercaseValidator(),
      this.numberValidator(),
      this.specialCharacterValidator()
    ];
  }


  uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      if (value && !/[A-Z]/.test(value)) {
        return { uppercase: true };
      }
      return null;
    };
  }
  lowercaseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      if (value && !/[a-z]/.test(value)) {
        return { lowercase: true };
      }
      return null;
    };
  }

  
  numberValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      if (value && !/[0-9]/.test(value)) {
        return { number: true };
      }
      return null;
    };
  }


  specialCharacterValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const value = control.value;
      if (value && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return { specialCharacter: true };
      }
      return null;
    };
  }


  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const newPassword = control.get('newPassword')?.value;
      const repeatNewPassword = control.get('repeatNewPassword')?.value;
      return newPassword === repeatNewPassword ? null : { mismatch: true };
    };
  }
  validateCurrentPassword(correctPassword: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const currentPassword = control.get('currentPassword')?.value;
      return currentPassword === correctPassword ? null : { invalidCurrentPassword: true };
    };
  }
  
}
