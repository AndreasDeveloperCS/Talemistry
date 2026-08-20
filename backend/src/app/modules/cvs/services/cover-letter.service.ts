import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { CoverLetter, CoverLetterDocument } from '../models/cover-letter-info';
import { InfoCVEnvelope } from '../models/cv-info-envelope';
import { IUser } from '../../users/interfaces/user.interface';
import { FileInfo } from '../models/file-info';

@Injectable()
export class CoverLetterService extends BaseService<CoverLetter> {

  constructor(
    @InjectModel(CoverLetter.name)
    protected readonly model: Model<CoverLetterDocument>,

    @InjectRepository(CoverLetter)
    protected readonly repository: Repository<CoverLetter>

  ) {
    super(model, repository);
  }

  async bulkPatchByUser(userId: any, propertyName: string, propertyValue: any): Promise<any> {
    try {
      const result = await this.model.updateMany(
        { userId },
        { $set: { [propertyName]: propertyValue } }
      );
      return result;
    } catch (error) {
      console.error('Error updating records:', error);
      throw error;
    }
  }

  covertFullEnvelopeIntoDto(info: InfoCVEnvelope, userProfile: IUser): CoverLetter {

    const entity: CoverLetter = {
      userId: userProfile._id,
      candidateInfo: info.candidateInfo,
      candidateProfile: userProfile,

      coverLetterText: this.setCoverLetterText(info.coverLetterText, info.coverLetterFileInfo),

      isFile: info.coverLetterFileInfo != undefined,
      coverLetterFileInfo: info.coverLetterFileInfo.length > 0 ? info.coverLetterFileInfo[0] : undefined,
      fileLastModifiedDate: info.coverLetterFileInfo.length > 0 ? info.coverLetterFileInfo[0]?.fileLastModifiedDate : undefined,
      originalName: info.coverLetterFileInfo.length > 0 ? info.coverLetterFileInfo[0]?.originalName : undefined,
      size: info.coverLetterFileInfo.length > 0 ? info.coverLetterFileInfo[0]?.size : undefined,

      ip: info.ip,
      mac: info.mac,
      isMain: true,
      gdprConfirmed: info.gdprConfirmed,

      createdDate: new Date(),
      sharedReadIds: [],
      sharedReadEmails: [],
      createdBy: userProfile._id,
    };

    return entity;
  }
  setCoverLetterText(coverLetterText: string, coverLetterFileInfo: FileInfo[]): string {
    if (coverLetterFileInfo.length > 0 && coverLetterFileInfo[0] != undefined && (coverLetterText == '' || coverLetterText == undefined)) {
      return 'Cover Letter is attached in File';
    }
    return coverLetterText;
  }

  covertEnvelopeIntoDto(info: CoverLetter, userProfile: IUser): CoverLetter {
    // console.log('covertEnvelopeIntoDto', info.coverLetterFileInfo);

    const entity: CoverLetter = {
      userId: userProfile._id,
      candidateProfile: userProfile,
      candidateInfo: info.candidateInfo,
      coverLetterText: this.setCoverLetterText(info.coverLetterText, [info.coverLetterFileInfo]),
      isFile: info.coverLetterFileInfo != undefined,
      coverLetterFileInfo: info.isFile ? info.coverLetterFileInfo : undefined,
      fileLastModifiedDate: info.isFile ? info.coverLetterFileInfo.fileLastModifiedDate : undefined,
      originalName: info.isFile ? info.coverLetterFileInfo.originalName : undefined,
      size: info.isFile ? info.coverLetterFileInfo.size : undefined,

      ip: info.ip,
      mac: info.mac,
      isMain: true,
      gdprConfirmed: info.gdprConfirmed,

      createdDate: new Date(),
      sharedReadIds: [],
      sharedReadEmails: [],
      createdBy: userProfile._id,
    };

    return entity;
  }

}
