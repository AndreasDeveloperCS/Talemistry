import { BaseEntity } from "../../general/models/base-entity";
import { FileData } from "../../general/models/file-data";

export class RecruitmentPlatform implements BaseEntity {
    _id?: any;
    name!: string;
    icon!: string;
    iconInfo: any;
    additionalInfo: any;
    cloudPath?: string;
    site!: string;
    apiUrl!: string;
    clientId!: string;
    clientSecret!: string;
    accessToken!: string;
    priority!: number;
    isVerified?: boolean = true;
    dateTimeAdded?:Date = new Date();
    dateTimeModified?:Date = new Date();
    expirationTokenDate?:Date = new Date();
}

export interface RecruitmentPlatformDialogResult {
    recruitmentPlatform: RecruitmentPlatform;
    fileData: FileData
}