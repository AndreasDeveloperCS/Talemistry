import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata, UseInterceptors } from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Request, Response } from 'express';
import { Blob } from 'node:buffer';
import { Readable } from 'node:stream';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { User } from '../../users/models/user';
import { BlogImage } from '../models/blog-image';
import { BlogPost } from '../models/blog-post';
import { BlogImageService } from '../services/blog-image.service';
import { BlogService } from '../services/blog.service';
import { ModuleRef } from '@nestjs/core';
const multer = require('multer');

@Controller('blogs')
@SetMetadata('entityModel', BlogPost) // REFLECTOR OPTION
export class BlogController extends BaseController<BlogPost> {
  override className: string = this.constructor.name;

  constructor(private blogService: BlogService,
    private blogImageService: BlogImageService,
    protected moduleRef: ModuleRef,
    private AWSFileShareService: AWSFileShareService
  ) {
    super(blogService, moduleRef);
  }

  @Get()
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('Blogs Authorization', request.headers.authorization);
    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;
      const accessFilter = this.getAccessFilters(request);
      const result = await this.blogService.getAllAsync(paginationParams, sorting, filtering, accessFilter);
      //console.log('Blogs Controller GET() ALL', result);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get(':_id')
  async getById(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const accessFilter = this.getAccessFilters(request);
      const result = await this.blogService.getByIdAsync(_id, accessFilter);
      console.log('Blogs Controller GET() by ID', result);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  // @Post('publish-linkedin')
  // async postLinkedinArticle(
  //   @Body() body: { userId: any, article: BlogPost },
  //   @Req() request: Request,
  //   @Res() response: Response): Promise<any> {
  //   console.log("@Post('publish-linkedin')", body);
  //   try {

  //     const user = this.utilitiesService.getUser(request);
  //     console.log('postLinkedinArticle ', user);
  //     const result = await this.linkedInAdapterService.postArticle(body);
  //     console.log('result', result)
  //     return response.status(201).json(result);
  //   } catch (error) {
  //     return response.status(error?.status).json(error);
  //   }
  // }

  @Post()
  @HttpCode(204)

  async post(
    @Body('info') info: string,
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: BlogPost,
    @Ip() ip) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      // console.log("body BlogPost", body);
      const requestingUser: User = this.utilitiesService.getUser(request);
      let blogPostEntity: BlogPost = body;
      console.log('Blog Post Entity', blogPostEntity);

      blogPostEntity.createdBy = requestingUser._id;
      blogPostEntity.author = `${requestingUser.firstname} ${requestingUser.lastname}`;
      try {
        blogPostEntity = await this.convertExternalImagesToInternal(blogPostEntity);
      } catch (error) {
        console.error(error);
      }
      const result = await this.blogService.createAsync(blogPostEntity);

      return response.status(200).json(result);

    } catch (error) {
      return response.status(500).json(error);
    }
  }

  async convertExternalImagesToInternal(blogPost: BlogPost): Promise<BlogPost> {
    const htmlContent = blogPost.content;
    const $ = cheerio.load(htmlContent);
    // Extract all image URLs
    const imageUrls: string[] = [];

    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        imageUrls.push(src);
      }
    });
    console.log('imageUrls', imageUrls);

    const promises: Promise<BlogImage>[] = [];

    $('img').each((index, el) => {
      const src = $(el).attr('src');
      // TODO replace for internal variable
      if (src && src.startsWith('http') && !src.includes('https://d6nrcrbzehdnr.cloudfront.net/evryka-blog-post-images')) {
        this.replaceSrcImage(src, blogPost, index, $, el, promises);
      }
      if (src && src.startsWith('https://oaidalleapiprodscus.blob.core.windows.net')) {
        this.replaceSrcImage(src, blogPost, index, $, el, promises);
      }
    });

    const insertedImages = await Promise.all(promises);

    const updatedHtml = $.html(); // Updated blog content with S3-hosted images
    blogPost.content = updatedHtml;
    return blogPost;
  }

  private replaceSrcImage(src: string, blogPost: BlogPost, index: number, $: cheerio.CheerioAPI, el, promises: Promise<BlogImage>[]) {
    const promise = (async () => {
      const file = await this.getImageFile(src, blogPost._id.toString(), index);
      const blogImageInserted = await this.blogImageService.uploadBlogImage(file, blogPost._id, blogPost?.createdBy);

      blogPost.images.splice(index, 0, blogImageInserted);

      $(el).attr('src', blogImageInserted.imagePath);
      return blogImageInserted;
    })();
    promises.push(promise);
  }

  async getImageFile(src: string, blogPostId: string, index: number): Promise<Express.Multer.File> {
    try {
      const response = await axios.get(src, {
        responseType: 'arraybuffer',
      });

      const contentType = (response.headers['content-type'] as string) || 'image/png';
      const buffer = Buffer.from(response.data, 'binary');
      const extension = contentType.split('/')[1] || 'png';
      const uniqueImageName = `${blogPostId}-image-${index + 1}.${extension}`;
      const blob = new Blob([buffer], { type: contentType });
      return {
        fieldname: 'file',
        originalname: uniqueImageName,
        encoding: '7bit',
        mimetype: contentType,
        size: blob.size,
        stream: Readable.from(blob.stream()),
        destination: '',
        filename: uniqueImageName,
        path: '',
        buffer: buffer
      } as Express.Multer.File;
    } catch (error) {
      console.error(`Error downloading image: ${src}`, error.message);
      throw new Error(`Failed to download image: ${src}`);
    }
  }

  @Post('OLD')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(204)
  async postOLD(
    @Body('info') info: string,
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: BlogPost,
    @Ip() ip) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      // console.log("body BlogPost", body);
      const requestingUser: User = this.utilitiesService.getUser(request);
      const blogPostEntity: BlogPost = body;
      console.log('Blog Post Entity', blogPostEntity);

      blogPostEntity.createdBy = requestingUser._id;
      blogPostEntity.author = `${requestingUser.firstname} ${requestingUser.lastname}`;
      // console.log("body BlogPost", blogPostEntity);
      const result = await this.blogService.createAsync(blogPostEntity);

      return response.status(200).json(result);

    } catch (error) {
      return response.status(500).json(error);
    }
  }
  @Put(':_id')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(204)
  async put(
    @Param('_id') _id: string,
    @Body('info') info: string,
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: BlogPost,
    @Ip() ip) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log(`@Put(${_id})`);

      // TODO: Remove old images, save new images and update links to Cloud Front using imagePath of image.

      let blogPostEntity: BlogPost = body;
      console.log('blogPostEntity', blogPostEntity);
      try {
        blogPostEntity = await this.convertExternalImagesToInternal(blogPostEntity);
      } catch (error) {
        console.error('result', error);
      }
      const result = await this.blogService.updateAsync(blogPostEntity);
      console.log('result', result);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Patch(':_id')
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
      console.log("@Patch(':_id')", _id, propertyName, body);
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];
      // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);

      const result = await this.blogService.patchAsync(_id, property, value);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Delete(':id')
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  @HttpCode(204)
  async delete(@Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const errors = [];
      const targetRemovingBlog = await this.blogService.getByIdAsync(id);
      targetRemovingBlog.images.forEach(async (image: BlogImage) => {
        try {
          const deletedImageFormAWS = await this.AWSFileShareService.deleteFile(image.Key);
          const deletedImageDescriptionItem = await this.blogImageService.deleteAsync(image._id);
        } catch (ex) {
          errors.push(ex.message);
        }
      });
      const result = await this.blogService.deleteAsync(id);
      return response.status(200).json({ result, errors });
    } catch (error) {
      return response.status(500).json(error);
    }
  }
}