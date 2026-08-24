import {
  Body, Controller,
  Get, HttpCode, MaxFileSizeValidator, Param, ParseFilePipe,
  Put, Req, Res, SetMetadata, UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { EmailService } from '../../email/services/email.service';
import { User } from '../../users/models/user';
import { ProfilePhotoService } from '../services/profile-photo.service';
import { ProfilePhoto } from '../models/profile-photo';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';

const fs = require("fs");
const path = require("path");
const multer = require('multer');

@Controller('profile-photos')
@SetMetadata('entityModel', ProfilePhoto)
export class ProfilePhotoController extends BaseController<ProfilePhoto> {

  constructor(
    private profilePhotoService: ProfilePhotoService,
    private emailService: EmailService,
    protected moduleRef: ModuleRef,
    private AWSFileShareService: AWSFileShareService
  ) {
    super(profilePhotoService, moduleRef);
  }

  //TODO implement sm
  @Get(':_id/old')
  @HttpCode(200)
  async getByIdOld(
    @Param('_id') userId: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    next: NextFunction) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      console.log(userId);
      // const requestingUser: User = this.utilitiesService.getUser(request);
      // const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");
      // const userRequestEqual = requestingUser._id == new ObjectId(userId);
      // console.log(userRequestEqual);
      var photo = await this.profilePhotoService.getProfilePhotoById(userId);
      console.log('Profile Photo', photo);

      if (!photo) {
        return response.status(200).send();
        //return response.status(404).json({ message: `Photo not found` });
      }
      const imageStream = await this.AWSFileShareService.getFile(photo.Key);

      imageStream.pipe(response);
      return response.status(200);
    } catch (error) {
      console.error(error);
      return response.status(500).json(error);
    }
  }

  @Get(':_id')
  @HttpCode(200)
  async getById(
    @Param('_id') userId: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    next: NextFunction) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      console.log('Profile photo by user id', userId);
      const photo = await this.profilePhotoService.getMainPhotoURL(userId);
      console.log('Profile Photo URL', photo);
      return response.status(200).send({ url: photo });
    } catch (error) {
      console.error(error);
      return response.status(500).json(error);
    }
  }

  @Put(':_id')
  @HttpCode(204)
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage()
  }))
  async upload(
    @Param('_id') userId: any,
    @UploadedFile('file', new ParseFilePipe({
      validators: [
        //new FileTypeValidator({ fileType: '.(pdf|doc|docx|rtf)' }),
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 * 1024 * 128 }),
      ]
    })) file: Express.Multer.File,
    @Body('') body: any,
    @Req() request: Request,
    @Res() response: Response,
    next: NextFunction) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('resultPhoto', file, body);
    try {
      const requestingUser: User = this.utilitiesService.getUser(request);
      const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");

      const userRequestEqual = requestingUser._id == userId;

      if (isAdmin || userRequestEqual) {
        var deletePhotoResult = await this.profilePhotoService.deleteOldPhoto(userId);
        console.log('old photo deleted', userRequestEqual, isAdmin, deletePhotoResult);

        var resultPhoto = await this.profilePhotoService.profilePhotoOneUpload(file, userId);

        this.emailService.sendAttachmentsFromStream([file], requestingUser, `Photo of ${requestingUser?.firstname} ${requestingUser?.firstname} has been changed`);
        return response.status(200).json(resultPhoto);
      } else {
        return response.status(403).json({ message: `User is not authorized to request or change this data` });
      }

    } catch (error) {
      console.error(error);
      return response.status(500).json(error);
    }
  }
}
