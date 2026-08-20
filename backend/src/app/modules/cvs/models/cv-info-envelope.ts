
import { ObjectId } from 'bson';
import { FileInfo } from './file-info';

export class CandidateInfoData {
    firstname: string = '';
    lastname?: string = '';
    email?: string = '';
    phone?: string = '';
    coverLetterText?: string = '';
    // coverLetterAttachments?:[] = [];
    // recaptcha?: string = '';
    // comment?: string= '';
}
export interface InfoCVEnvelope {
    userId: ObjectId;
    candidateInfo?: CandidateInfoData;
    gdprConfirmed: boolean;

    cvFileInfo: FileInfo;

    withCoverLetter: boolean;
    withCoverLetterAttachment: boolean;
    coverLetterText?: string;
    coverLetterFileInfo: FileInfo[];

    positionId?: ObjectId;
    ip?: string;
    mac?: string;
}
