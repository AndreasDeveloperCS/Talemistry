import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseController } from '../../base/controllers/base.controller';
import { UtilitiesService } from '../../core/services/utilities.service';
import { User } from '../../users/models/user';
import { BlogPostComment } from '../models/blog-comment';
import { BlogPostCommentService } from '../services/blog-comment.service';
import { ModuleRef } from '@nestjs/core';

@Controller('blog-post-comments')
@SetMetadata('entityModel', BlogPostComment)
export class BlogPostCommentController extends BaseController<BlogPostComment> {
    override className: string = this.constructor.name;

    constructor(protected service: BlogPostCommentService, protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    @Get(':blogPostId')
    async findCommentsByBlogPost(
        @Param('blogPostId') blogPostId: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {

            console.log('BlogPostCommentController', blogPostId);
            
            const result = await this.service.findCommentsByBlogPost(blogPostId);

            console.log('Get result', result);

            return response.status(200).json(result);

        } catch (error) {
            const status = error.status && Number.isInteger(error.status) ? error.status : 500;
            return response.status(status).json(error);
        }
    }

    @Post()
    async addBlogComment(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log('BlogPostCommentController', body);
            const user: User = this.utilitiesService.getUser(request);
            const newComment: Partial<BlogPostComment> = {
                userId: user._id,
                userName: `${user.firstname} ${user.lastname}`,
                createdBy: user._id,
                content: body.content,
                blogPostId: body.blogPostId,
                parentId: body?.parentId
            };
            const result = await this.service.addBlogPostComment(newComment);
            console.log('Post result', result);
            return response.status(200).json(result);
        } catch (error) {
            const status = error.status && Number.isInteger(error.status) ? error.status : 500;
            return response.status(status).json(error);
        }
    }

    @Put()
    @HttpCode(204)
    async putPayload(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        return await super.putAsync(body, request, response, ip);
    }

    @Put(':id')
    @HttpCode(204)
    async put(
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        return await super.putAsync(body, request, response, ip);
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
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':_id')
    @HttpCode(204)
    async delete(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const result = await this.service.deleteComment(_id);
            console.log('Delete result', result);
            return response.status(200).json(result);
        } catch (error) {
            const status = error.status && Number.isInteger(error.status) ? error.status : 500;
            return response.status(status).json(error);
        }
    }
}