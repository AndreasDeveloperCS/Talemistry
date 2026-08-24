import { environment } from "../../../../../environments/environment";
import { BaseEntity } from "../../../general/models/base-entity";
import { CandidateInfoData } from "./candidate-info";
import { FileInfo } from "./file-info";

export class CoverLetterInfo implements BaseEntity {
    _id?: any;

    isMain?: boolean = false;

    gdprConfirmed: boolean = false;

    userId?: string | null = sessionStorage.getItem(`${environment.storage.userId}`);

    candidateInfo: CandidateInfoData = new CandidateInfoData();

    coverLetterText: string = '';

    coverLetterFileInfo?: FileInfo = new FileInfo();

    withCoverLetterAttachment = false;

    ip?: string;
    mac?: string;

    isFile: boolean = false;

    originalName?: string;
    fileLastModifiedDate?: Date;
    size?: string;

    createdDate?: Date = new Date();
    modifiedDate?: Date;

}