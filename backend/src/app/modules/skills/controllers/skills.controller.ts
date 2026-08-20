import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { BaseController } from '../../base/controllers/base.controller';

import { ObjectId } from 'bson';
import { NextFunction, Request, Response } from 'express';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { Skill } from '../models/skill';
import { SkillsService } from '../services/skills.service';
import { ModuleRef } from '@nestjs/core';
import { User } from '../../users/models/user';

@Controller('skills')
@SetMetadata('entityModel', Skill)
export class SkillsController extends BaseController<Skill> {

    constructor(protected service: SkillsService, protected moduleRef: ModuleRef) {
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
            // console.log('@@@Skills filterParams input', filterParams);
            // console.log('@@@Skills filterParams deserialized', JSON.parse(filterParams));
            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering
            );
            //console.log('@@@Skills result', paginationResult);

            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getByIdAsync(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const accessFilter = this.getAccessFilters(request);
            const result = await this.service.getByIdAsync(_id, accessFilter);
            response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        console.log('Post Skills', body);
        const user: User = this.utilitiesService.getUser(request);
        const entity = request.body as Skill;
        entity.createdBy = new ObjectId(user._id);
        entity.createdDate = new Date(Date.now());
        const isExisting = await this.service.isExisting(entity);

        if (isExisting) {
            return response.status(200).send(entity);
        }

        return await super.postAsync(entity, request, response, ip);
    }

    @Put(':_id')
    @HttpCode(204)
    async edityId(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        next: NextFunction
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log('Post Skills', request.body);

            const result = await this.service.updateAsync(request.body);
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
            return response.status(500).send(error);
        }
    }

    @Delete(':_id')
    @HttpCode(204)
    async deleteById(
        @Param('_id') _id: any,
        @Req() request: Request,
        @Res() response: Response,
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const objectId = new ObjectId(_id);
            const result = await this.service.deleteAsync(objectId);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }
}
