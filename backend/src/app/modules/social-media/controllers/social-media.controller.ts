import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  SetMetadata,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SocialMedia } from '../models/social-media';
import { SocialMediaService } from '../services/social-media.service';
const multer = require('multer');

import { Pagination, PaginationParams } from '../../../helpers/pagination';

import * as fs from 'fs';
import * as path from 'path';
import { Filtering } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';

import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectId } from 'bson';
import { diskStorage } from 'multer';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { getBaseDir } from '../../../common/utils/path.helper';
import { SocialMediaIconService } from '../services/social-media-icon.service';

@Controller('social-media')
@SetMetadata('entityModel', SocialMedia)
export class SocialMediaController extends BaseController<SocialMedia> {
  private keyName: string = 'socialMedia';

  constructor(protected service: SocialMediaService,
    protected socialMediaIconService: SocialMediaIconService,
    protected moduleRef: ModuleRef,
  ) {
    super(service, moduleRef);
  }

  @Get()
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const filtering: Filtering = filterParams
        ? JSON.parse(filterParams)
        : undefined;

      const paginationResult = await this.service.getAllAsync(
        paginationParams,
        sorting,
        filtering
      );

      const socialMedia = await this.service.getSocialMedia();
      paginationResult[this.keyName] = socialMedia;
      return response.status(200).json(paginationResult);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get(':_id')
  async getById(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const result = await this.service.getByIdAsync(_id);
      response.status(200).json(result);
    } catch (error) {
      return response.status(200).send(error);
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('icon'))
  async createSocialMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      console.log('createSocialMedia body', body, file);
      const user = this.utilitiesService.getUser(request);
      console.log('createSocialMedia user', user);

      const info = typeof body.info === 'string' ? JSON.parse(body.info) : body.info;

      const uploaded = await this.socialMediaIconService.uploadSocialMediaIcon(
        file,
        user._id 
      );
      
      console.log('createSocialMedia icon', uploaded);

      const result = await this.service.createSocialMedia(info, uploaded);
      console.log('createSocialMedia result', result);
      
      return response.status(200).send(result);
    } catch (error) {
      console.error(error);
      return response.status(500).send({
        status: 'ERROR',
        message: 'Could not save social media',
        error,
      });
    }
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('icon'))
  async updateSocialMedia(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      console.log('updateSocialMedia body', body, file);
      const user = this.utilitiesService.getUser(request);
      const info = typeof body.info === 'string' ? JSON.parse(body.info) : body.info;

      let uploaded;

      if (file) {
        const existingSM = await this.service.getByIdAsync(id);
        uploaded = await this.socialMediaIconService.updateSocialMediaIcon(file, user._id, existingSM);
      } 

      const result = await this.service.updateSocialMedia(info, uploaded);
      console.log('updateSocialMedia result', result);

      return response.status(200).send(result);

    } catch (error) {
      console.error(error);
      return response.status(500).send({
        status: 'ERROR',
        message: 'Could not update social media',
        error,
      });
    }
  }

  @Patch(':_id')
  async patch(
    @Param('_id') _id: string,
    @Query('propertyName') propertyName: string,
    @Body() body: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];

      const result = await this.service.patchAsync(_id, property, value);

      return response.status(200).send(result);
    } catch (error) {
      console.error(`Could not patch ${propertyName}: ${error}`);
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const entityDeleting: SocialMedia = await this.service.getByIdAsync(id);

      try {
        const deleteIcon = await this.socialMediaIconService.deleteOldPhoto(entityDeleting);
        console.log('Deleted social media icon', deleteIcon);
      } catch (error) {
        console.error(`Could not delete social media icon Sync: ${error}`);
      }

      try {
        const result: SocialMedia = await this.service.deleteAsync(id);
        console.log('Deleted social media platform', result);
      } catch (error) {
        console.error(`Could not delete social media record in Database: ${error}`);
      }

      return response.status(200).send({ message: `Record with ID: ${id} successfully removed` });
    } catch (error) {
      console.error(`Could not delete social media icon: ${error.message}`);
      return response.status(500).send(error);
    }
  }

  // Old
  
  @Post('old')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.posix.join(
            `public`,
            `social-media-icons`
          );

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    })
  )
  async post(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 1024 * 1024 * 128,
          }),
        ],
      })
    )
    file: Express.Multer.File,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    try {
      console.log('Body', body);
      const info = JSON.parse(body.info);

      const rootFolder = path.posix.join(
        `public`,
        `social-media-icons`
      );

      // this.AWSFileShareService.uploadFile(file,subFolderName);
      const entity: SocialMedia = {
        name: info.name,
        icon: path.posix.join(rootFolder, file.originalname),
        relativePath: path.posix.join(rootFolder, file.originalname),
        absolutePath: path.posix.join(getBaseDir(), rootFolder, file.originalname),
        mainUrl: info.mainUrl,
        priority: info.priority,
        isVerified: false,
        createdBy: new ObjectId(), 
        createdDate: new Date(Date.now()),
        Bucket: '',
        imagePath: '',
        Key: ''
      };
      const result = await this.service.createAsync(entity);

      response.header('Access-Control-Allow-Origin', request.headers.origin);

      return response.status(200).send(result);

    } catch (error) {
      console.error(error);

      const responseContent = {
        status: 'ERROR',
        message: `Could not save social media icons into database ${error}`,
        error: error,
      };

      response.header('Access-Control-Allow-Origin', request.headers.origin);
      return response.status(500).send(responseContent);
    }
  }

  @Put()
  @HttpCode(204)
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const currentDir = getBaseDir();
          const uploadDir = path.posix.join(
            `public`,
            `social-media-icons`
          );

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          // console.log(file);

          if (file)
            cb(null, file.originalname);
        },
      }),
    })
  )
  async putPayload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          //new FileTypeValidator({ fileType: '.(pdf|doc|docx|rtf)' }),
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 1024 * 1024 * 128,
          }),
        ],
      })
    )
    file: Express.Multer.File,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const info = JSON.parse(body.info);
      const rootFolder = this.getRootFolder();

      const relativePath = path.posix.join(rootFolder, file.originalname);
      const absolutePath = path.posix.join(getBaseDir(), relativePath);

      const entityNew: SocialMedia = {
        _id: info._id,
        name: info.name,
        icon: relativePath,
        relativePath: relativePath,
        absolutePath: absolutePath,
        mainUrl: info.mainUrl,
        priority: info.pririty,
        isVerified: false,
        createdBy: new ObjectId(),
        createdDate: new Date(Date.now()),
        Bucket: '',
        imagePath: '',
        Key: ''
      };

      await this.checkIconsExtensionAndRemove(entityNew);

      const result = await this.service.updateAsync(entityNew);

      return response.status(200).send(result);

    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  private deleteIcon(entity: SocialMedia) {
    const relativePath = entity.icon;
    try {

      const filePath = path.posix.join(
        getBaseDir(),
        relativePath
      );
      const exists = fs.existsSync(filePath);
      // console.log("Delete Icon Sync", getBaseDir(), filePath, exists);

      // console.log('Before Deleting Sync');
      if (exists) {
        // console.log('If exists', exists);
        fs.unlinkSync(filePath);
        // console.log('After Deleted');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  private async deleteIconAsync(entity: SocialMedia): Promise<void> {
    const relativePath = entity.icon;
    try {

      // const filePath = path.resolve(  getBaseDir(),  relativePath);
      const filePath = path.posix.join(
        getBaseDir(),
        relativePath
      );

      const exists = fs.existsSync(filePath);
      // console.log("Delete Icon Async",   getBaseDir(),filePath, exists);

      // console.log('Before Deleting');
      // if(exists) {
      //   fs.unlinkSync(filePath);
      // }
      return new Promise((resolve, reject) => {
        if (exists) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              reject(new HttpException('Error deleting file', HttpStatus.INTERNAL_SERVER_ERROR));
            } else {
              resolve();
            }
          });
        } else {
          // console.log('Path Does not exist After attempt of Deleting', filePath);
        }
      });
    } catch (error) {
      console.error(error, relativePath);
    }

  }

  async checkNewIconNameAndRename(entityNew: SocialMedia) {
    const entityOld: SocialMedia = await this.service.getByIdAsync(entityNew._id);
    const oldPath = entityOld.icon;
    const newPath = entityNew.icon;

    // Check if the file exists
    if (!fs.existsSync(oldPath)) {
      throw new NotFoundException(`File ${oldPath} not found`);
    }

    // Rename the file
    fs.rename(oldPath, newPath, (err) => {
      if (err) throw err;
      // console.log(`Renamed ${oldPath} to ${newPath}`);
    });
  }
  async checkIconsExtensionAndRemove(entityNew: SocialMedia) {
    const entityOld: SocialMedia = await this.service.getByIdAsync(entityNew._id);
    if (entityOld.icon != entityNew.icon) {
      await this.deleteIconAsync(entityOld);
      this.deleteIcon(entityOld);
    }
  }

  getRootFolder() {
    return path.posix.join(
      `public`,
      `social-media-icons`
    );
  }
}


