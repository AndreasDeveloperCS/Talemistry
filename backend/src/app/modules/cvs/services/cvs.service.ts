import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { IUser } from '../../users/interfaces/user.interface';
import { CVParserGateway } from '../gateways/cv-parser.gateway';
import { CoverLetter, CoverLetterDocument } from '../models/cover-letter-info';
import { InfoCVEnvelope } from '../models/cv-info-envelope';
import { DocumentHistoryDto } from '../models/document-history.dto';
import { InfoCvDocument, InfoCvDto } from '../models/info-cv';
import { OpenAIHelperService } from './open-ai.service';
import { ResumeParserService } from './resume-parser.service';

@Injectable()
export class CvsService extends BaseService<InfoCvDto> {

  constructor(
    @InjectModel(InfoCvDto.name)
    protected readonly model: Model<InfoCvDocument>,

    @InjectRepository(InfoCvDto)
    protected readonly repository: Repository<InfoCvDto>,

    @InjectModel(CoverLetter.name)
    protected readonly clModel: Model<CoverLetterDocument>,
    private cvParserGateway: CVParserGateway,
    private resumeParserService: ResumeParserService,
    private openAIHelperService: OpenAIHelperService,

  ) {
    super(model, repository);
  }

  covertEnvelopeIntoDto(info: InfoCVEnvelope, userProfile: IUser): InfoCvDto {

    const entity: InfoCvDto = {
      userId: userProfile._id,
      candidateInfo: info.candidateInfo,
      candidateProfile: userProfile,
      cvFileInfo: info.cvFileInfo,
      fileLastModifiedDate: info.cvFileInfo.fileLastModifiedDate,
      originalName: info.cvFileInfo.originalName,
      size: info.cvFileInfo.size,
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

  public async getDocumentHistory(userId: ObjectId): Promise<DocumentHistoryDto> {
    const [cvCount, clCount, lastCv, lastCl] = await Promise.all([
      this.model.countDocuments({ userId }),
      this.clModel.countDocuments({ userId }),

      this.model
        .findOne({ userId })
        .sort({ createdDate: -1 })
        .select('createdDate')
        .lean(),

      this.clModel
        .findOne({ userId })
        .sort({ createdDate: -1 })
        .select('createdDate')
        .lean()
    ]);

    return {
      cvCount,
      clCount,
      lastCvUpload: lastCv?.createdDate ?? null,
      lastClUpload: lastCl?.createdDate ?? null
    } as DocumentHistoryDto;
  }

  public async processCVAsync(
    cvId: string,
    files: Express.Multer.File[],
    cvInfo: any
  ) {
    const room = cvId;

    try {
      // STEP 1
      this.cvParserGateway.server.to(room).emit('uploaded');
      await this.delay(600);

      // STEP 2
      this.cvParserGateway.server.to(room).emit('parsing');
      await this.delay(700);

      const parsedPDF = await this.resumeParserService.parsePDFPath(
        files[0].buffer,
        cvInfo.cvFileInfo.Location
      );

      // STEP 3
      this.cvParserGateway.server.to(room).emit('ai-processing');
      //await this.delay(1500);

      const result =
        await this.openAIHelperService.generateStructuredTalentProfile(
          parsedPDF.rawText
        );
      //const result = { ok: true }; 

      // STEP 4
      this.cvParserGateway.server.to(room).emit('finalizing');
      await this.delay(700);

      // FINAL RESULT
      this.cvParserGateway.server.to(room).emit('parsed-cv', result);

    } catch (err) {
      console.error('Processing error', err);
      this.cvParserGateway.server.to(room).emit('error');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
