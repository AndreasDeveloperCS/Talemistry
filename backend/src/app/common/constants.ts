import { Token } from 'typedi';

export const HTTP_SERVER_TOKEN = new Token('httpServer');

export const ALREADY_REGISTER_ERROR = 'User is already registered';
export const USER_NOT_FOUND_ERROR = 'This email was not found as registered';
export const WRONG_PASSWORD_ERROR = 'Password is not valid';
export const WRONG_VERIFICATION_CODE = 'Wrong or expired verification code';

export const ROLES_KEY = 'roles';
