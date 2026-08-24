import {
  Body, Controller, Delete, Get, Ip, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Put, Query, Req, Res, SetMetadata, UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CoverLetterService } from '../services/cover-letter.service';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const { Worker, isMainThread, parentPort } = require('worker_threads');

@Controller('cover-letters')
@SetMetadata('entityModel', CoverLetter)
export class CoverLetterController extends BaseController<CoverLetter> {
  private folderName: string = 'evryka-cv';

  constructor(protected service: CoverLetterService,
    private userService: UsersService,
    private authService: AuthService,
    private emailService: EmailService,
    private AWSFileShareService: AWSFileShareService,
    protected moduleRef: ModuleRef) {
    super(service, moduleRef);
  }

  @Get()
  async getAll(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {

    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {

      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      let filtering: Filtering = filterParams
        ? JSON.parse(filterParams)
        : undefined;

      const user = this.utilitiesService.getUser(request);

      if (user) {
        const newFilter: CustomFilter = { property: 'userId', rule: FilterRule.EQUALS, value: user.userId };
        filtering.push(newFilter);
      }

      const cls = await this.service.getAllAsync(
        paginationParams,
        sorting,
        filtering,
        // "cover-letter"
      );

      console.log('Cover letter items', JSON.stringify(cls, null, 2));

      response.status(200).json(cls);
    } catch (error) {
      console.error(error);
      response.status(500).send(error);
    }
  }


  @Get(':_id')
  async getStream(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('getStream CV', _id);
    
    try {
      //console.log('getStream', id);
      //const id = this.service.getObjectId(_id);
      //const accessFilter = this.getAccessFilters(request);
      const results: CoverLetter = await this.service.getByIdAsync(_id);
      //console.log('CoverLetter', results);
      if (results.isFile) {
        console.log('InfoCvDto', results.coverLetterFileInfo);
        const fileStream = await this.AWSFileShareService.getFile(results.coverLetterFileInfo.Key);
        // const fileObject = await this.AWSFileShareService.getFileObject(results.cvFileInfo.Key);
        response.setHeader('Content-Type', results.coverLetterFileInfo.mimetype);
        //response.setHeader('Content-Disposition', `inline; filename="${results.cvFileInfo.originalName}"`);
        response.setHeader('Cache-Control', `no-cache`);
        console.log('getStream CL');
        fileStream.pipe(response);
      }
      //response.status(200).json(results);
    } catch (error) {
      console.error('getStream CL', error);
      response.status(500).send(error);
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage: multer.memoryStorage() })
  )
  async upload(
    //@Param('_id') _id: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip,
    @UploadedFile('file', new ParseFilePipe({
      validators: [
        //new FileTypeValidator({ fileType: '.(pdf|doc|docx|rtf)' }),
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 * 1024 * 128 }),
      ]
    })) file: Express.Multer.File | undefined) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log('POST cover-letters body.info', body.info, file);
      console.log('POST cover-letters file', file);
      const info = JSON.parse(body.info);
      // console.log(info);

      try {
        this.emailService.sendAttachment(file, info);
      } catch (ex) {
        console.error(ex);
        return response.status(500).json(ex);
      }

      const user = await this.userService.findByEmail(info.candidateInfo.email);
      console.log('Determined user for Cover Letter:', user);
      const userId = info.userId ?? await this.checkAndCreateNewUser(user, info);
      console.log('Determined userId for Cover Letter:', userId);
      const candidateProfile = await this.userService.findById(userId);

      const coverLetter: CoverLetter = await this.service.covertEnvelopeIntoDto(info, candidateProfile);
      // console.log('coverLetter.isFile', coverLetter.isFile);
      if (coverLetter.isFile) {
        try {

          const subFolderName = `${userId ?? "common"}/CoverLetter`;
          // console.log('AWSFileShareService', coverLetter.coverLetterFileInfo);
          const awsResult = await this.AWSFileShareService.uploadFile(this.folderName, file, subFolderName, file.originalname);
          console.log('AWS Result', awsResult);
          coverLetter.coverLetterFileInfo.cloudPath = awsResult.Location;
          coverLetter.coverLetterFileInfo.Location = awsResult.Location;
          coverLetter.coverLetterFileInfo.ETag = awsResult.ETag;
          coverLetter.coverLetterFileInfo.Bucket = awsResult.Bucket;
          coverLetter.coverLetterFileInfo.Key = awsResult.Key;

        } catch (ex) {
          console.error(ex);
          return response.status(500).json(ex);
        }
      }

      try {
        let result: CoverLetter;
        const patchResult = await this.service.bulkPatchByUser(coverLetter.userId, 'isMain', false);
        if (coverLetter._id) {
          const existingCoverLetter = await this.service.getByIdAsync(coverLetter._id);
          coverLetter.userId = new ObjectId(coverLetter.userId);
          coverLetter.createdBy = new ObjectId(coverLetter.createdBy);

          if (existingCoverLetter) {
            result = await this.service.updateAsync(coverLetter);
          } else {
            result = await this.service.createAsync(coverLetter);
          }
        } else {
          result = await this.service.createAsync(coverLetter);
        }

        return response.status(200).json(result);
      } catch (ex) {
        console.error(ex);
        return response.status(500).json(ex);
      }
    } catch (error) {
      console.error(error);
      return response.status(500).json(error);
    }
  }

  async checkAndCreateNewUser(user: User, candidateInfo: any): Promise<any> {

    if (!user) {
      const authDto: UserDto = {
        firstname: candidateInfo.firstname,
        lastname: candidateInfo.lastname,
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        role: [ROLES.TALENT],
      }
      const userCreated: IVerificationRequest = await this.userService.registerUser(authDto);

      // console.log(userCreated);
      return userCreated.userId;
    } else {
      return user._id;
    }
  }

  @Put(':_id')
  async edityId(
    @Param("_id") _id: string,
    @Req() req: Request,
    @Res() res: Response,
    next: NextFunction
  ) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const editedResult = await this.service.updateAsync(req.body);
      res.status(200).json(editedResult);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  }

  @Patch(':_id')
  async patchById(
    @Param("_id") _id: string,
    @Req() req: Request,
    @Res() res: Response,
    next: NextFunction
  ) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const keyValue = JSON.parse(JSON.stringify(req.body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];

      if (property == 'isMain') {
        const coverLetter: CoverLetter = await this.service.getByIdAsync(_id);

        const patchResult = await this.service.bulkPatchByUser(coverLetter.userId, 'isMain', false);

        const result = await this.service.patchAsync(_id, property, value);

        res.status(200).json(result);
      } else {
        const result = await this.service.patchAsync(_id, property, value);
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
    const clInfoDTO: CoverLetter = await this.service.getByIdAsync(_id);
    console.log('deleteById clInfoDTO', clInfoDTO);

    let isRecordSuccess = {
      id: _id,
      success: false, message: ''
    };
    let isFileSuccess = {
      id: _id,
      success: false, message: ''
    };

    try {
      const deletedResult = await this.AWSFileShareService.deleteFile(clInfoDTO.coverLetterFileInfo.Key);
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
