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
import { RecruitmentPlatformService } from '../services/recruitment-platform.service';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import * as fs from 'fs';
import * as path from 'path';
import { Filtering } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectId } from 'bson';
import { diskStorage } from 'multer';
import { BaseController } from '../../base/controllers/base.controller';
import { BlogPost } from '../../blog/models/blog-post';
import { RecruitmentPlatform } from '../models/recruitment-platform';
import { LinkedInAdapterService } from '../services/linked-in-adapter.service';
import { ModuleRef } from '@nestjs/core';
import { getBaseDir } from '../../../common/utils/path.helper';

@Controller('linked-in-recruitment-platforms')
@SetMetadata('entityModel', RecruitmentPlatform)
export class LinkedInRecruitmentPlatformController extends BaseController<RecruitmentPlatform> {

  constructor(protected service: RecruitmentPlatformService,
    protected moduleRef: ModuleRef,
    private linkedInAdapterService: LinkedInAdapterService) {
    super(service, moduleRef);
  }

  @Post('auth/linkedin')
  async getLinkedInUserData(
    @Body() body: { userId: any, code: any },
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    console.log("@Post('auth-linkedin')", body);
    try {
      const user = this.utilitiesService.getUser(request);
      const token = await this.linkedInAdapterService.getAccessToken(body);
      console.log('LinkedInRecruitmentPlatformController LinkedIn Id Token', user, token?.id_token);
      const linkedInUser = await this.linkedInAdapterService.decodeIdToken(token.id_token);
      console.log('LinkedIn user', linkedInUser);
      const sessionToken = await this.linkedInAdapterService.createSessionToken(token, linkedInUser, user._id);
      return response.status(200).json(sessionToken);
    } catch (error) {
      console.error(error);
      return response.status(error?.status).json({ message: error?.message });
    }
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

      // const bearerToken = await this.linkedInAdapterService.getAccessToken();
      // const requestResult = await this.linkedInAdapterService.getPublishedJobs(bearerToken);
      //  // console.log("requestResult", requestResult);
      const recruitmentPlatform = await this.service.getRecruitmentPlatforms();
      paginationResult['recruitmentPlatform'] = recruitmentPlatform;
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
      const accessFilter = this.getAccessFilters(request);
      const result = await this.service.getByIdAsync(_id, accessFilter);
      response.status(200).json(result);
    } catch (error) {
      return response.status(200).send(error);
    }
  }

  @Post('publish-linkedin')
  async postLinkedinArticle(
    @Body() body: { userId: any, article: BlogPost },
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    console.log("@Post('publish-linkedin')", body);
    try {

      const user = this.utilitiesService.getUser(request);
      console.log('postLinkedinArticle ', user);
      const result = await this.linkedInAdapterService.postArticle(body);
      console.log('result', result)
      return response.status(201).json(result);
    } catch (error) {
      return response.status(error?.status).json(error);
    }
  }
  @Post()
  @HttpCode(201)
  // @Roles(ROLES.SA, ROLES.ADMIN)
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
          cb(null, file.originalname);
        },
      }),
    })
  )
  async post(
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
    try {
      // console.log('Body', body);
      const info = JSON.parse(body.info);

      const rootFolder = path.posix.join(
        `public`,
        `social-media-icons`
      );

      const user = this.utilitiesService.getUser(request);

      // this.AWSFileShareService.uploadFile(file,subFolderName);
      const entity: RecruitmentPlatform = {
        name: info.name,
        icon: path.posix.join(rootFolder, file.originalname),
        site: info.site,
        iconInfo: info.iconInfo,
        additionalInfo: info.additionalInfo,
        accessToken: info.accessToken,
        apiUrl: info.apiUrl,
        clientId: info.clientId,
        clientSecret: info.clientSecret,
        priority: info.priority,
        userId: new ObjectId(user._id),
        isVerified: true,
        createdBy: new ObjectId(user._id),
        createdDate: new Date(Date.now()),
        // imagePath:path.posix.join(rootFolder, file.originalname)
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
  // @Roles(ROLES.SA, ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const currentDir = getBaseDir('putPayload');
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
      const absolutePath = path.posix.join(getBaseDir('putPayload'), relativePath);

      // this.AWSFileShareService.uploadFile(file,subFolderName);

      const user = this.utilitiesService.getUser(request);

      const entityNew: RecruitmentPlatform = {
        _id: info._id,
        name: info.name,
        icon: relativePath,
        site: info.site,
        apiUrl: info.apiUrl,
        priority: info.pririty,
        iconInfo: info.iconInfo,
        additionalInfo: info.additionalInfo,
        clientId: '',
        clientSecret: '',
        accessToken: '',
        userId: new ObjectId(user._id),
        isVerified: true,
        createdBy: new ObjectId(user._id),
        createdDate: new Date(Date.now()),
      };

      await this.checkIconsExtensionAndRemove(entityNew);

      const result = await this.service.updateAsync(entityNew);

      return response.status(200).send(result);

    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Put(':id')
  @HttpCode(204)
  // @Roles(ROLES.SA, ROLES.ADMIN)
  async put(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {

    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {

      // console.log('Info', id, body);

      const info = body;

      const rootFolder = this.getRootFolder()

      const relativePath = info.icon;
      const absolutePath = path.posix.join(getBaseDir('LinkedInRecruitmentPlatformController'), relativePath);


      const user = this.utilitiesService.getUser(request);

      // this.AWSFileShareService.uploadFile(file,subFolderName);
      const entityNew: RecruitmentPlatform = {
        _id: info._id,
        name: info.name,
        icon: relativePath,
        site: info.site,
        apiUrl: info.apiUrl,
        priority: info.pririty,
        iconInfo: info.iconInfo,
        additionalInfo: info.additionalInfo,
        clientId: '',
        clientSecret: '',
        accessToken: '',
        userId: new ObjectId(user._id),
        isVerified: true,
        createdBy: new ObjectId(user._id),
        createdDate: new Date(Date.now()),
        // imagePath:path.posix.join(rootFolder, file.originalname)
      };

      await this.checkNewIconNameAndRename(entityNew);

      const result = await this.service.updateAsync(entityNew);

      return response.status(200).send(result);

    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Patch(':_id')
  // @Roles(ROLES.SA, ROLES.ADMIN)
  async patch(
    @Param('_id') _id: string,
    @Query('propertyName') propertyName: string,
    @Body() body: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      // console.log(_id, propertyName, body);
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];
      // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);
      const id = new ObjectId(_id);
      const result = await this.service.patchAsync(_id, property, value);

      return response.status(200).send(result);
    } catch (error) {
      console.error(`Could not patch ${propertyName}: ${error}`);
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Delete(':id')
  // @Roles(ROLES.SA, ROLES.ADMIN)
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      const entityDeleting: RecruitmentPlatform = await this.service.getByIdAsync(id);
      try {
        this.deleteIcon(entityDeleting);
      } catch (error) {
        console.error(`Could not delete social media icon Sync: ${error}`);
      }

      try {
        const result: RecruitmentPlatform = await this.service.deleteAsync(id);
      } catch (error) {
        console.error(`Could not delete social media record in Database: ${error}`);
      }

      // try {
      //   const iconRemoved = await this.deleteIconAsync(entityDeleting);
      //    // console.log(iconRemoved); 
      // } catch (error) {
      //   console.error(`Could not delete social media icon Async: ${error}`);
      // }

      response.header('Access-Control-Allow-Origin', request.headers.origin);
      return response.status(200).send({ message: `Record with ID: ${id} successfully removed` });
    } catch (error) {
      console.error(`Could not delete social media icon: ${error.message}`);
      response.header('Access-Control-Allow-Origin', request.headers.origin);
      return response.status(500).send(error);
    }
  }

  private deleteIcon(entity: RecruitmentPlatform) {
    const relativePath = entity.icon;
    try {

      const filePath = path.posix.join(
        getBaseDir('deleteIcon'),
        relativePath
      );
      const exists = fs.existsSync(filePath);
      // console.log("Delete Icon Sync",  getBaseDir(), filePath, exists);

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
  private async deleteIconAsync(entity: RecruitmentPlatform): Promise<void> {
    const relativePath = entity.icon;
    try {

      const filePath = path.posix.join(
        getBaseDir('deleteIconAsync'),
        relativePath
      );

      const exists = fs.existsSync(filePath);
      return new Promise((resolve, reject) => {
        if (exists) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              reject(new HttpException('Error deleting file', HttpStatus.INTERNAL_SERVER_ERROR));
            } else {
              resolve();
              // console.log('After Deleting');
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

  async checkNewIconNameAndRename(entityNew: RecruitmentPlatform) {
    const entityOld: RecruitmentPlatform = await this.service.getByIdAsync(entityNew._id);
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

  async checkIconsExtensionAndRemove(entityNew: RecruitmentPlatform) {
    const entityOld: RecruitmentPlatform = await this.service.getByIdAsync(entityNew._id);
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


