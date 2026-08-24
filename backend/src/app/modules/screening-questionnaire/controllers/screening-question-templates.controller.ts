import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ScreeningQuestionTemplate } from '../models/screening-question-template';
import { ScreeningQuestionTemplatesService } from '../services/screening-question-templates.service';
import { User } from '../../users/models/user';

@Controller('screening-question-templates')
@SetMetadata('entityModel', ScreeningQuestionTemplate)
export class ScreeningQuestionTemplatesController extends BaseController<ScreeningQuestionTemplate> {
    override className: string = this.constructor.name;
    private questionsLimitDefault: number = 10;

    constructor(protected service: ScreeningQuestionTemplatesService,
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

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Get('recommended/positionTitle/:positionTitle')
    @HttpCode(200)
    async getRecommended(
        @Param('positionTitle') positionTitle: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try{
            console.log(`Recommended Questions Controller request:`, positionTitle);

            const recommendedQuestions = await this.service.getTemplatesByPositionTitle(positionTitle, this.questionsLimitDefault);
            console.log('Recommended Questions', recommendedQuestions);

            return response.status(200).send(recommendedQuestions);
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

        try{
            console.log(`Screening Question Template Controller Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }
            let questionTemplate: ScreeningQuestionTemplate = { 
                ...body,
                usageCount: 0,
                userId: new ObjectId(body.userId),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            const createdQuestionTemplate: ScreeningQuestionTemplate = await this.service.createAsync(questionTemplate);
            console.log('Screening Question Template created', createdQuestionTemplate);

            return response.status(200).send(createdQuestionTemplate);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
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