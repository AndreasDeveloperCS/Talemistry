import { CandidateInfoData } from "./candidate-info";
import { FileInfo } from "./file-info";

export interface InfoCVEnvelope {
    userId:any;
    candidateInfo:CandidateInfoData;

    gdprConfirmed:boolean;

    withCoverLetter:boolean;
    withCoverLetterAttachment:boolean;

    cvFileInfo:FileInfo;
    coverLetterFileInfo:FileInfo[];
    coverLetterText:string;

    positionId?:any;

    ip?: string;
    mac?: string;
}