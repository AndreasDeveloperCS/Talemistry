export class FileInfo {
    originalName?: string;
    fileLastModifiedDate?: Date;
    encoding?: string;
    mimetype?: string;
    size?: number;
    filename?: string;
    extension?: string;

    path?: string;
    cloudPath?:string;
    destination?: string;

    Location: string;
    ETag: string;
    Bucket: string;
    Key: string;
}