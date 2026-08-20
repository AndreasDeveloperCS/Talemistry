
import { AbstractControl } from "@angular/forms";
import { RECRUITMENTROLES, ROLES, SignUpRoleGroup, TALENTROLES } from "./roles";


export class SignInInfo {
  email?: AbstractControl<any, any>;
  password?: AbstractControl<any, any>;
  recaptcha?: AbstractControl<any, any>;
}

export class SignInData {
  email: string = '';
  password: string = '';
  recaptcha?: string = '';
}

export class SignUpInfo {
  firstname?: AbstractControl<any, any>;
  lastname?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  password?: AbstractControl<any, any>;
  confirmPassword?: AbstractControl<any, any>;
  verificationCode?: AbstractControl<any, any>;
  phone?: AbstractControl<any, any>;
  role?: AbstractControl<any, any>;
  //roles?: AbstractControl<any, any>;
  roleGroups?: AbstractControl<any, any>;
  recaptcha?: AbstractControl<any, any>;
}

export class SignUpData {
  firstname?: string = '';
  lastname?: string = '';
  email?: string = '';
  password?: string = '';
  confirmPassword?: string = '';
  verificationCode?: string = '';
  phone?: string = '';
  role?:  ROLES;
  recaptcha?: string = '';
  isSocialUser?: boolean = false;
}

export class VerificationEmailInfo {
  userId?: AbstractControl<any, any>;
  username?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  verificationCode?: AbstractControl<any, any>;
  password?: AbstractControl<any, any>;
  confirmPassword?: AbstractControl<any, any>;
  recaptcha?: AbstractControl<any, any>;
}

export class VerificationEmailData {
  requestId?: string = '';
  userId?: string = '';
  username?: string = '';
  email: string = '';
  verificationCode: string = '';
  password?: string = '';
  confirmPassword?: string = '';
  recaptcha?: string = '';
}

export class PasswordRecoveryInfo {
  email?: AbstractControl<any, any>;
  recaptcha?: AbstractControl<any, any>;
}
export class PasswordRecoveryData {
  email: string = '';
  recaptcha?: string = '';
}
