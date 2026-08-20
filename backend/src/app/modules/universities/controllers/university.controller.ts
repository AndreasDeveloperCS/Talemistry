import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { University } from '../models/university';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { UniversityService } from '../services/university.service';
import { User } from '../../users/models/user';

@Controller('universities')
@SetMetadata('entityModel', University)
export class UniversityController extends BaseController<University> {

    constructor(protected service: UniversityService,
        protected moduleRef: ModuleRef,
    ) {
        super(service, moduleRef)
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
            const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

            const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);
            const counties = await this.service.getCountries();
            paginationResult['countries'] = counties;
            return response.status(200).json(paginationResult);

        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        
        try {
            console.log(`University Inserted entity:`, body);
            const requestingUser: User = this.utilitiesService?.getUser(request);
            console.log(`University Inserted entity userId:`, body, requestingUser._id);
            const insertedEntity: University = await this.service.createIfNotExists(body, requestingUser._id);
            console.log(`University Inserted entity:`, insertedEntity);

            return response.status(insertedEntity ? 201 : 200).send(insertedEntity);
        } catch (error: any) {
            if (error?.code === 11000) {
                const existing = await this.service['model']
                    .findOne({ name: body.name?.trim() })
                    .collation({ locale: 'en', strength: 2 })
                    .lean();
                return response.status(200).send(existing);
            }

            console.error(error);
            return response.status(500).send(error);
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
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':_id')
    @HttpCode(204)
    async delete(
        @Param('_id') _id: any,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const objectId = new ObjectId(_id);
            const result = await this.service.deleteAsync(objectId);
            console.log('Delete Position result', result);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }
}
