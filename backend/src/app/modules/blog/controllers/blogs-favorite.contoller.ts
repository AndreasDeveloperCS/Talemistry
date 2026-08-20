import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { BlogFavorite } from '../models/blog-favorite';
import { BlogsFavoriteService } from '../services/blogs-favorite.service';
import { ModuleRef } from '@nestjs/core';

@Controller('blogs-favorite')
@SetMetadata('entityModel', BlogFavorite)
export class BlogsFavoriteController extends BaseController<BlogFavorite> {
    override className: string = this.constructor.name;

    constructor(protected service: BlogsFavoriteService,
        protected moduleRef: ModuleRef,
    ) {
        super(service, moduleRef);
    }

    @Get()
    @HttpCode(200)
    async getFavoriteBlogsIds(
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const user: User = this.utilitiesService.getUser(request);
            const result = await this.service.getFavoriteBlogsIds(user._id);
            console.log(result);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Post('favorite')
    @HttpCode(201)
    async favoriteBlog(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const blogId = body?.blogId;
            console.log('BlogsFavoriteController favoriteBlog', blogId);
            const user: User = this.utilitiesService.getUser(request);
            const result = await this.service.addBlogToFavorite(user._id, blogId);
            return response.status(200).json(result);
        } catch (error) {
            const status = error.status && Number.isInteger(error.status) ? error.status : 500;
            return response.status(status).json(error);
        }
    }

    @Post('unfavorite')
    @HttpCode(201)
    async unfavoriteBlog(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const blogId = body?.blogId;
            console.log('BlogsFavoriteController unfavoriteBlog', blogId);
            const user: User = this.utilitiesService.getUser(request);
            const result = await this.service.removeBlogFromFavorite(user._id, blogId);
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
        return await super.deleteAsync(_id, request, response);
    }
}