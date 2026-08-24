import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { User } from '../../users/models/user';
import { BlogImage } from '../models/blog-image';
import { BlogImageService } from '../services/blog-image.service';
import { ModuleRef } from '@nestjs/core';
const multer = require('multer');

@Controller('blog-images')
@SetMetadata('entityModel', BlogImage) // REFLECTOR OPTION
export class BlogImageController extends BaseController<BlogImage> {
  // STATIC FIELD OPTION
  //public static entityModel = BlogImage;
  override className: string = this.constructor.name;

  constructor(protected service: BlogImageService,
    protected moduleRef: ModuleRef,
    private AWSFileShareService: AWSFileShareService) {
    super(service, moduleRef);
  }

  @Get()
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    // console.log();

    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
      const accessFilter = this.getAccessFilters(request);
      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;
      const result = await this.service.getAllAsync(paginationParams, sorting, filtering, accessFilter);
      return response.status(200).json(result);
    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Get(':_id')
  async getImage(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      console.log(`@Get(${_id})`);
      const results: BlogImage = await this.service.getByIdAsync(_id);
      //console.log('resultsGet', results);
      const presignedUrl = await this.AWSFileShareService.getPresignedUrlAsync(results.Key);
      //console.log('presignedUrlGet', presignedUrl);
      return response.status(200).json(results.imagePath);
    } catch (error) {
      console.error('Error retrieving image:', error);
      response.status(500).send(error);
    }
  }

  @Post()
  @HttpCode(201)
  // // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  // @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files[]', 100, multer.memoryStorage()))
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('info') info: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      //TODO: get userId from the header and add into the createdBy field
      const requestingUser: User = await this.utilitiesService.getUser(request);
      console.log('upload images info', info);

      const blogId = JSON.parse(info).value;
      const results = await this.service.uploadBlogImages(files, blogId, requestingUser?._id);
      console.log('POSTS IMAGES', results);

      response.status(201).json(results);
    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Put()
  // // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  @UseInterceptors(FilesInterceptor('files[]', 100, multer.memoryStorage()))
  @HttpCode(204)
  async put(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
    @Body('info') info: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      //TODO: get userId from the header and add into the createdBy field
      console.log('upload images info', info);
      const requestingUser: User = this.utilitiesService.getUser(request);
      const blogId = JSON.parse(info).value;
      const results = await this.service.uploadBlogImages(files, blogId, requestingUser._id);
      console.log('POSTS IMAGES', results);

      response.status(201).json(results);
      // const blogPostEntity:BlogPost = JSON.parse(info);
      // const result = await this.service.updateAsync(blogPostEntity);

      // result.id = result.id.toString();

      //return response.status(200).json(result);

    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Delete(':id')
  // // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  async delete(
    @Param("id") id: any,
    @Body('info') info: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {

      //const blogPostEntity: BlogPost = JSON.parse(info);
      const result = await this.service.deleteAsync(id);

      return response.status(200).json(result);

    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Patch(':_id')
  // // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  async patch(
    @Param('_id') _id: string,
    @Query('propertyName') propertyName: string,
    @Body() body: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      // console.log(_id, propertyName, body);
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];
      // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);

      const result = await this.service.patchAsync(_id, property, value);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json(error);
    }
  }
}