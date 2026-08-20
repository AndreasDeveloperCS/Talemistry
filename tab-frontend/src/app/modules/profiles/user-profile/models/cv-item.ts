import { CandidateInfoData } from "./candidate-info";
import { InfoCVEnvelope } from "./info-cv-envelope";
import { FileInfo } from "./file-info";
import { CoverLetterInfo } from "./cover-letter";
import { BaseEntity } from "../../../general/models/base-entity";
import { environment } from "../../../../../environments/environment";
import { FileData } from "../../../general/models/file-data";

export class InfoCV implements BaseEntity {
    _id?: any;
    isMain: boolean = false;
    gdprConfirmed: boolean = false;
    userId?: string | null = sessionStorage.getItem(`${environment.storage.userId}`);

    candidateInfo?: CandidateInfoData;
    cvFileInfo?: FileInfo;

    ip?: string;
    mac?: string;

    originalName?: string;
    fileLastModifiedDate?: Date;
    size?: string;

    createdDate?: Date = new Date();
    modifiedDate?: Date;
}

export interface CvDataInternalEnvelope {
    cvFileChanged?: boolean;
    coverLetterFileChanged?: boolean;
    info: InfoCVEnvelope;
    cvFileData: FileData;
    coverLetterFileData: FileData[];
}

export interface CoverLetterDataInternalEnvelope {
    info: CoverLetterInfo;
    coverLetterFileData?: FileData;
}