import {
  Body, Controller, Delete, Get, InternalServerErrorException, Ip,
  Param, Patch, Post, Put, Query, Req, Res,
  SetMetadata,
  StreamableFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import { ROLES } from '../../../common/enums';
import { CustomFilter, Filtering, FilterRule } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { AuthService } from '../../auth/services/auth.service';
import { BaseController } from '../../base/controllers/base.controller';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { EmailService } from '../../email/services/email.service';
import { IVerificationRequest } from '../../users/interfaces/user.interface';
import { UserDto } from '../../users/models/auth.dto';
import { User } from '../../users/models/user';
import { UsersService } from '../../users/services/user.service';
import { CoverLetter } from '../models/cover-letter-info';
import { InfoCVEnvelope } from '../models/cv-info-envelope';
import { InfoCvDto } from '../models/info-cv';
import { CoverLetterService } from '../services/cover-letter.service';
import { CvsService } from '../services/cvs.service';
import { ModuleRef } from '@nestjs/core';
import { ResumeParserService } from '../services/resume-parser.service';
const multer = require('multer');
const { Worker, isMainThread, parentPort } = require('worker_threads');
import { TalentProfileSchema } from "../../profiles/models/talent-profile";
import { OpenAIHelperService } from '../services/open-ai.service';
import { ObjectId } from 'bson';
import { CVParserGateway } from '../gateways/cv-parser.gateway';

@Controller('cvs')
@SetMetadata('entityModel', InfoCvDto)
export class CvsController extends BaseController<InfoCvDto> {

  constructor(protected cvService: CvsService,
    protected resumeParserService: ResumeParserService,
    protected coverLetterService: CoverLetterService,
    private userService: UsersService,
    private authService: AuthService,
    private emailService: EmailService,
    private openAIHelperService: OpenAIHelperService,
    private readonly cvParserGateway: CVParserGateway,
    protected moduleRef: ModuleRef,
    private AWSFileShareService: AWSFileShareService
  ) {
    super(cvService, moduleRef);
  }

  @Get()
  async getAll(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    console.log('getAll', filterParams);
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const requestingUser: User = this.utilitiesService.getUser(request);

      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const isAdmin = requestingUser.role.some(role => role.toUpperCase() == ROLES.SA.toUpperCase());

      const isCandidate = requestingUser.role.some(role => role.toUpperCase() == ROLES.TALENT.toUpperCase());

      const filtering: Filtering = [];

      if (isCandidate) {
        const filter: CustomFilter = {
          property: 'userId',
          rule: FilterRule.EQUALS,
          value: requestingUser._id
        };
        filtering.push(filter);
      }

      const cvs = await this.service.getAllAsync(
        paginationParams,
        sorting,
        filtering
      );

      console.log('CVs items', JSON.stringify(cvs, null, 2));

      response.status(200).json(cvs);
    } catch (error) {
      console.error(error);
      response.status(500).send(error);
    }
  }

  @Get('document-history')
  async getDocumentHistory(
    @Param('_id') id: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const user = await this.utilitiesService.getUser(request);
      const result = await this.cvService.getDocumentHistory(new ObjectId(user._id));
      console.log('Document History', result);

      return response.status(200).json(result);
    } catch (error) {
      console.error('getStream CV', error);
      response.status(500).send(error);
    }
  }

  @Get(':_id')
  async getStream(
    @Param('_id') id: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('getStream CV', id);
    try {
      const accessFilter = this.getAccessFilters(request);
      const results: InfoCvDto = await this.service.getByIdAsync(id, accessFilter);
      console.log('InfoCvDto', results.cvFileInfo);
      const fileStream = await this.AWSFileShareService.getFile(results.cvFileInfo.Key);

      response.set({
        'Content-Type': results.cvFileInfo.mimetype,
        'Content-Disposition': `inline; filename="${encodeURIComponent(results.cvFileInfo.originalName)}"`,
        'Cache-Control': 'no-store',
        'Content-Length': String(results.cvFileInfo.size ?? ''),
      });

      return new StreamableFile(fileStream, { type: results.cvFileInfo.mimetype });
    } catch (error) {
      console.error('getStream CV', error);
      response.status(500).send(error);
    }
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files[]', 100, { storage: multer.memoryStorage() })
  )
  async upload(
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip,
    @UploadedFiles() files: Array<Express.Multer.File>,
    next: NextFunction
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    console.log('CVS Controller POST method', body.info);

    try {
      const info: InfoCVEnvelope = JSON.parse(body.info);

      // =========================
      // 👤 USER
      // =========================
      const user = await this.userService.findByEmail(info.candidateInfo.email);
      const userId = info.userId ?? await this.checkAndCreateNewUser(user, info);
      const candidateProfile = await this.userService.findById(userId);

      info.userId = info.userId ?? userId;
      info.candidateInfo.coverLetterText = info.coverLetterText;

      // =========================
      // 📄 CV DTO PREP
      // =========================
      const cvInfoDTO: InfoCvDto =
        await this.cvService.covertEnvelopeIntoDto(info, candidateProfile);

      let cvInfo: InfoCvDto;

      // =========================
      // ☁️ UPLOAD CV TO AWS
      // =========================
      if (files.length > 0) {
        try {
          const subFolderName = `${userId}/CV`;

          const awsResult = await this.AWSFileShareService.uploadFile(
            'evryka-cv',
            files[0],
            subFolderName,
            files[0].originalname
          );

          cvInfoDTO.cvFileInfo = {
            ...cvInfoDTO.cvFileInfo,
            cloudPath: awsResult.Location,
            Location: awsResult.Location,
            ETag: awsResult.ETag,
            Bucket: awsResult.Bucket,
            Key: awsResult.Key
          };

        } catch (ex) {
          console.error('CV AWS upload failed', ex);
          return response.status(500).json(ex);
        }
      }

      // =========================
      // 💾 SAVE CV TO DB
      // =========================
      try {
        await this.cvService.bulkPatchByUser(cvInfoDTO.userId, 'isMain', false);

        console.log("CV DTO before creation", cvInfoDTO);

        cvInfo = await this.cvService.createAsync(cvInfoDTO);

      } catch (ex) {
        console.error('CV DB save failed', ex);
        return response.status(500).json(ex);
      }

      const cvId = cvInfo?._id?.toString();

      // =========================
      // 📄 COVER LETTER (OPTIONAL)
      // =========================
      if (info.withCoverLetter || info.withCoverLetterAttachment) {
        try {
          let coverLetter: CoverLetter =
            await this.coverLetterService.covertFullEnvelopeIntoDto(info, candidateProfile);

          if (files.length > 1) {
            await this.coverLetterService.bulkPatchByUser(userId, 'isMain', false);

            try {
              const subFolderName = `${userId}/CL`;

              const awsResult = await this.AWSFileShareService.uploadFile(
                'evryka-cv',
                files[1],
                subFolderName,
                files[1].originalname
              );

              coverLetter.coverLetterFileInfo = {
                ...coverLetter.coverLetterFileInfo,
                cloudPath: awsResult.Location,
                Location: awsResult.Location,
                ETag: awsResult.ETag,
                Bucket: awsResult.Bucket,
                Key: awsResult.Key
              };

            } catch (ex) {
              console.error('CL AWS upload failed', ex);
              return response.status(500).json(ex);
            }

            console.log("CL before creation", coverLetter);

            await this.coverLetterService.createAsync(coverLetter);
          }

        } catch (ex) {
          console.error('Cover letter failed', ex);
          return response.status(500).json(ex);
        }
      }

      // =========================
      // 🚀 RETURN EARLY (IMPORTANT)
      // =========================
      response.status(200).json({
        success: true,
        parsed: false,
        obj: null,
        cvId
      });

      // =========================
      // 🔥 ASYNC PROCESSING
      // =========================
      this.cvService.processCVAsync(cvId, files, cvInfo).catch(err =>
        console.error('Async processing failed', err)
      );

    } catch (ex) {
      console.error(ex);
      return response.status(500).json(ex);
    }
  }

  @Post('old')
  @UseInterceptors(
    FilesInterceptor('files[]', 100, { storage: multer.memoryStorage() })
  )
  async uploadOld(
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip,
    @UploadedFiles() files: Array<Express.Multer.File>,
    next: NextFunction
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('CVS Controller POST method', body.info);

    try {
      const info: InfoCVEnvelope = JSON.parse(body.info);

      let cvInfo: InfoCvDto;

      const user = await this.userService.findByEmail(
        info.candidateInfo.email
      );

      const userId =
        info.userId ??
        await this.checkAndCreateNewUser(user, info);

      const candidateProfile =
        await this.userService.findById(userId);

      const cvInfoDTO: InfoCvDto =
        await this.cvService.covertEnvelopeIntoDto(
          info,
          candidateProfile
        );

      try {
        info.userId = info.userId ?? userId;
        info.candidateInfo.coverLetterText =
          info.coverLetterText;

        // this.emailService.sendAttachmentsFromStream(files, info.candidateInfo);
      } catch (ex) {
        console.error(ex);
        return response.status(500).json(ex);
      }

      const subFolderName = `${userId ?? 'common'}/CV/${cvInfo?._id ?? 'common'}`;

      if (files.length > 0) {
        try {
          const awsResult =
            await this.AWSFileShareService.uploadFile(
              'evryka-cv',
              files[0],
              subFolderName,
              files[0].originalname
            );

          console.log('AWS Result', awsResult);

          cvInfoDTO.cvFileInfo.cloudPath = awsResult.Location;
          cvInfoDTO.cvFileInfo.Location = awsResult.Location;
          cvInfoDTO.cvFileInfo.ETag = awsResult.ETag;
          cvInfoDTO.cvFileInfo.Bucket = awsResult.Bucket;
          cvInfoDTO.cvFileInfo.Key = awsResult.Key;

        } catch (ex) {
          console.error(ex);
          return response.status(500).json(ex);
        }
      }

      try {
        await this.cvService.bulkPatchByUser(
          cvInfoDTO.userId,
          'isMain',
          false
        );

        console.log(
          'CV DTO before creation',
          cvInfoDTO,
          JSON.stringify(cvInfoDTO, null, 2)
        );

        cvInfo = await this.cvService.createAsync(cvInfoDTO);

      } catch (ex) {
        console.error(ex);
        return response.status(500).json(ex);
      }

      // COVER LETTER LOGIC
      if (info.withCoverLetter || info.withCoverLetterAttachment) {
        try {
          let coverLetter: CoverLetter =
            await this.coverLetterService.covertFullEnvelopeIntoDto(
              info,
              candidateProfile
            );

          if (files.length > 1) {
            await this.coverLetterService.bulkPatchByUser(
              user._id,
              'isMain',
              false
            );

            try {
              const subFolderName = `${userId ?? 'common'}/CV/${coverLetter?._id ?? 'common'}`;

              const awsResult =
                await this.AWSFileShareService.uploadFile(
                  'evryka-cv',
                  files[1],
                  subFolderName,
                  files[1].originalname
                );

              console.log('AWS Result', awsResult);

              coverLetter.coverLetterFileInfo.cloudPath =
                awsResult.Location;

              coverLetter.coverLetterFileInfo.Location =
                awsResult.Location;

              coverLetter.coverLetterFileInfo.ETag =
                awsResult.ETag;

              coverLetter.coverLetterFileInfo.Bucket =
                awsResult.Bucket;

              coverLetter.coverLetterFileInfo.Key =
                awsResult.Key;

            } catch (ex) {
              console.error(ex);
              return response.status(500).json(ex);
            }

            console.log(
              'CL Info before creation',
              coverLetter,
              JSON.stringify(coverLetter, null, 2)
            );

            coverLetter =
              await this.coverLetterService.createAsync(
                coverLetter
              );
          }

        } catch (ex) {
          console.error(ex);
          return response.status(500).json(ex);
        }
      }

      return response.status(200).json({
        success: true,
        cvId: cvInfo?._id
      });

    } catch (ex) {
      console.error(ex);
      return response.status(500).json(ex);
    }
  }

  async checkAndCreateNewUser(user: User, candidateInfo: any): Promise<any> {

    if (!user) {
      const authDto: UserDto = {
        firstname: candidateInfo.firstname,
        lastname: candidateInfo.lastname,
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        role: [ROLES.TALENT]
      }
      const userCreated: IVerificationRequest = await this.userService.registerUser(authDto);

      //console.log(userCreated);
      return userCreated.userId;
    } else {
      return user._id;
    }
  }

  @Put(':_id')
  async edityId(@Param("_id") _id: string, @Req() req: Request, @Res() res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const editedResult = await this.service.updateAsync(req.body);
      return res.status(200).json(editedResult);
    } catch (error) {
      console.error(error);
      return res.status(500).send(error);
    }
  }


  @Patch(':_id')
  async patchById(@Param("_id") _id: string, @Req() req: Request, @Res() res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const keyValue = JSON.parse(JSON.stringify(req.body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];

      if (property == 'isMain') {
        const cvInfoDTO: InfoCvDto = await this.service.getByIdAsync(_id);

        const patchResult = await this.cvService.bulkPatchByUser(cvInfoDTO.userId, 'isMain', false);

        const result = await this.cvService.patchAsync(_id, property, value);

        res.status(200).json(result);
      } else {
        const result = await this.cvService.patchAsync(_id, property, value);
        return res.status(200).json(result);
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send(error);
    }
  }

  @Delete(':_id')
  async deleteById(
    @Param("_id") _id: string,
    @Req() req: Request,
    @Res() res: Response,
    next: NextFunction) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    const cvInfoDTO: InfoCvDto = await this.service.getByIdAsync(_id);
    console.log('deleteById cvInfoDTO', cvInfoDTO);

    let isRecordSuccess = {
      id: _id,
      success: false, message: ''
    };
    let isFileSuccess = {
      id: _id,
      success: false, message: ''
    };

    try {
      const deletedResult = await this.AWSFileShareService.deleteFile(cvInfoDTO.cvFileInfo.Key);
      isRecordSuccess = {
        id: _id,
        success: true, message: 'File has been removed'
      };
    } catch (error) {
      console.error(error);
      isRecordSuccess = {
        id: _id,
        success: false, message: error.message
      };
    }
    try {
      const result = await this.service.deleteAsync(_id);
      isFileSuccess = {
        id: _id,
        success: true, message: 'Record has been removed'
      };

    } catch (error) {
      console.error(error);
      isRecordSuccess = {
        id: _id,
        success: false, message: error.message
      };
    }

    if (!isFileSuccess || !isRecordSuccess) {
      return res.status(500).send({ isFileSuccess, isRecordSuccess });
    } else {
      return res.status(200).json({ isFileSuccess, isRecordSuccess });
    }
  }
}
