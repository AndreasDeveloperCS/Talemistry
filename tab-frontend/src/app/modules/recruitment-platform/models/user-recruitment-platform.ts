import { BaseEntity } from "../../general/models/base-entity";

export class UserRecruitmentPlatform implements BaseEntity {
    _id?: any;
    userId?: any;
    rpId?: any;
    name?: string;
    additionalInfo?: string;
    cloudPath?: string;
    site!: string;
    apiUrl!: string;
    clientId!: string;
    clientSecret!: string;
    accessToken?: string;
    code?: string;
    priority?: number;
    isVerified?: boolean;
    dateTimeAdded?: Date = new Date();
    dateTimeModified?: Date = new Date();
    expirationTokenDate?: Date = new Date();
}