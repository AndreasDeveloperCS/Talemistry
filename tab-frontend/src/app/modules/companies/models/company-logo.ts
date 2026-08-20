export class CompanyLogo {
    _id?: any;
    imagePath?: string;
    Location?: string;
    ETag?: string;
    Bucket?: string;
    Key?: string;
    presignedUrl?: string;
    originalName?: string;
    mimetype?: string;
    size?: number;
    isVerified: boolean = true;
    userId: any;
    createdBy: any;
    createdDate: Date = new Date();
}