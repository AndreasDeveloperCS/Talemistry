import { AbstractControl } from "@angular/forms";
import { BaseEntity } from "../../general/models/base-entity";
import { FileData } from "../../general/models/file-data";

export class SocialMedia implements BaseEntity{
    createdDate: Date = new Date();
    modifiedDate?: Date;
    priority!: number;
    _id?: any;
    icon:any;
    name!:string;
    mainUrl!: string;
    isVerified: boolean= true;
    relativePath?: string;
    absolutePath?: string;
    cloudPath?: string;
    Bucket: string = '';
    imagePath: string = '';
    Key: string = '';
}

export class UserSocialMedia {
    type: SocialMedia = new SocialMedia();
    profileLink!:string;
    profileLinks:string[] = [];
    priority: number = 1;
}

export class UserSocialMediaForm {
    icon?: AbstractControl<any, any>;
    name?: AbstractControl<any, any>;
    type?: AbstractControl<any, any>;
    profileLink?: AbstractControl<any, any>;
    priority?: AbstractControl<any, any>;
}

export interface SocialMediaDialogResult {
    socialMediaInfo: SocialMedia;
    fileData: FileData
}