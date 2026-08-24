import { ObjectId } from "bson";

export interface IUser {
  _id?: any;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  username?: string;
  login?: string;
  isVerifiedEmail?: boolean;
  isVerifiedPhone?: boolean;
  role?: any;
}

export interface IVerificationRequest {
  requestId?: string;
  userId?: ObjectId;
  email: string;
}

export interface IVerificationData {
  requestId?: string;
  userId?: string;
  username?: string;
  email: string;
  verificationCode: string;
  password?: string;
  confirmPassword?: string;
  capcha?: string;
}

