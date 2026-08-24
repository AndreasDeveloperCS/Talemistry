import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FileInfo } from "../models/file-info";
import { CandidateInfoData } from "../models/candidate-info";
import { InfoCVEnvelope } from "../models/info-cv-envelope";
import { CoverLetterInfo } from "../models/cover-letter";
import { User } from "../../authentication/models/user";
import { FileData } from "../../general/models/file-data";
import { ClientInfoService } from "../../general/services/get-client-info.service";
import { UserProfileService } from "../../profiles/user-profile/services/user-profile.service";

@Injectable({
    providedIn: 'root'
})
export class CandidateInfoConverterService {
    userId!: string;
    user: User = new User();

    constructor(http: HttpClient,
        public userProfileService: UserProfileService,
        private clientInfoService: ClientInfoService) {

    }

    getInfoFullEnvelope(cvFileData: FileData,
        coverLetterText: string = '',
        coverLetterFileData: FileData[],
        positionId?: any): InfoCVEnvelope {

        const info: InfoCVEnvelope = {
            gdprConfirmed: false,
            userId: this.userProfileService.userId,
            candidateInfo: this.userProfileService?.user ?? new CandidateInfoData(),
            cvFileInfo: this.convertFileInfo(cvFileData),
            ip: this.clientInfoService.currentIp,
            coverLetterText: coverLetterText,
            withCoverLetter: coverLetterText != '' || !(coverLetterFileData.length > 0),
            withCoverLetterAttachment: !(coverLetterFileData.length > 0),
            coverLetterFileInfo: []
        };
        console.log('getInfoFullEnvelope', info);

        if (positionId) {
            info.positionId = positionId;
        }

        if (coverLetterFileData.length > 0) {
            coverLetterFileData.forEach((fileData: FileData) => {
                info.coverLetterFileInfo.push(this.convertFileInfo(fileData));
            });
        }

        return info;
    }

    getInfoCoverLetterEnvelope(coverLetterText: string, coverLetterFileData: FileData | undefined = undefined): CoverLetterInfo {
        console.log('convertFileInfo', coverLetterFileData);
        const coverLetterInfo: CoverLetterInfo = {
            gdprConfirmed: false,
            userId: this.userProfileService.userId,
            candidateInfo: this.userProfileService?.user ?? new CandidateInfoData(),
            coverLetterText: coverLetterText,
            isFile: coverLetterFileData != undefined,
            ip: this.clientInfoService.currentIp,
            withCoverLetterAttachment: coverLetterFileData != undefined
        };

        if (coverLetterFileData) {
            coverLetterInfo.coverLetterFileInfo = this.convertFileInfo(coverLetterFileData);
            coverLetterInfo.originalName = coverLetterInfo.originalName;
            coverLetterInfo.fileLastModifiedDate = coverLetterInfo.fileLastModifiedDate;
            coverLetterInfo.size = coverLetterInfo.size;
        }

        return coverLetterInfo;
    }

    convertFileInfo(fileData: FileData): FileInfo {
        console.log('convertFileInfo', fileData);

        const cvFileInfo = new FileInfo();
        cvFileInfo.filename = fileData.fileInfo.name;
        cvFileInfo.originalName = fileData.fileInfo.name;
        cvFileInfo.size = fileData.fileInfo.size;
        cvFileInfo.mimetype = fileData.fileInfo.type;
        cvFileInfo.fileLastModifiedDate = fileData.fileInfo.lastModifiedDate ?? new Date(fileData.fileInfo.lastModified);
        cvFileInfo.extension = fileData.fileInfo.name.substring(fileData.fileInfo.name?.lastIndexOf('.') + 1);
        return cvFileInfo;
    }

    sanitizeFilename(filename: string): string {
        return filename
            .normalize('NFKD') // Normalize Unicode characters (e.g., remove diacritical marks)
            .replace(/[\u2013\u2014]/g, '-') // Replace en-dash and em-dash with hyphen
            .replace('%E2%80%93', '-')
            .replace(/\s+/g, '_') // Replace multiple spaces with a single space
            .replace(/%20/g, '_')
            .replace(/[^a-zA-Z0-9\s.-_]/g, '') // Remove any non-alphanumeric characters (except ., -)
            .trim(); // Remove leading/trailing spaces
    }
}