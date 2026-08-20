import { BaseEntity } from "../../general/models/base-entity";

export interface VideoRecord extends BaseEntity {

    _id?: any;

    userId: any;
    imagePath?: string;
    Location: string;
    ETag: string;
    Bucket: string;
    Key: string;

    presignedUrl: string;
    originalName?: string;
    mimetype?: string;
    size?: number;
    sharedReadIds: any[];
    sharedReadEmails: string[];
    createdBy: any;

    createdDate: Date;
    modifiedBy?: any;

    modifiedDate: Date;
}

export interface VideoUploadResult {
    s3Url: string;
    success: boolean;
    message?: string;
}