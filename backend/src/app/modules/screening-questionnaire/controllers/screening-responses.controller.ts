import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { ScreeningResponse } from '../models/screening-response';
import { ScreeningResponsesService } from '../services/screening-responses.service';
import { ObjectId } from 'bson';

@Controller('screening-responses')
@SetMetadata('entityModel', ScreeningResponse)
export class ScreeningResponsesController extends BaseController<ScreeningResponse> {
    override className: string = this.constructor.name;

    constructor(protected service: ScreeningResponsesService,
        protected moduleRef: ModuleRef) {
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('form/:formId')
    async getByFormId(
        @Param('formId') formId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getByFormId', formId);
        try {
            const screeningResponse = await this.service.getByFormIdAsync(formId);

            return response.status(200).json(screeningResponse);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talent/:talentId')
    async getByTalentId(
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getByTalentId', talentId);
        try {
            const screeningResponse = await this.service.getByTalentIdAsync(talentId);

            return response.status(200).json(screeningResponse);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId')
    async getByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getByPositionId', positionId);
        try {
            const screeningResponse = await this.service.getByPositionIdAsync(positionId);

            return response.status(200).json(screeningResponse);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId/talent/:talentId')
    async getByPositionIdTalentId(
        @Param('positionId') positionId: string,
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getByPositionIdTalentId', positionId, talentId);
        try {
            const screeningResponse = await this.service.getByPositionIdTalentIdAsync(positionId, talentId);

            return response.status(200).json(screeningResponse);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('all-responses/form/:formId')
    async getAllByFormId(
        @Param('formId') formId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getAllByFormId', formId);
        try {
            const screeningResponses = await this.service.getAllByFormIdAsync(formId);

            return response.status(200).json(screeningResponses);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: ScreeningResponse,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log(`Screening Response Controller Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            let screeningResponse: ScreeningResponse = { 
                formId: new ObjectId(body.formId),
                positionId: new ObjectId(body.positionId),
                talentId: new ObjectId(body.talentId),
                userId: new ObjectId(body.userId),
                answers: body.answers,
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            console.log('ScreeningResponse to create', screeningResponse);

            const createdScreeningResponse: ScreeningResponse = await this.service.createAsync(screeningResponse);
            console.log('Created Screening Response', createdScreeningResponse);
            return response.status(200).send(createdScreeningResponse);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Put(':_id')
    @HttpCode(204)
    async put(
        @Param('_id') _id: string,
        @Body() body: ScreeningResponse,
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

    @Delete(':id')
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.deleteAsync(id, request, response);
    }
}