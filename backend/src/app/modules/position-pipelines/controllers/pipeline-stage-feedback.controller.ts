import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { PipelineStage } from '../models/pipeline-stage';
import { ObjectId } from 'bson';
import { PipelineStageFeedback } from '../models/pipeline-stage-feedback';
import { PipelineStageFeedbacksService } from '../services/pipeline-stage-feedback.service';

@Controller('pipeline-stage-feedbacks')
@SetMetadata('entityModel', PipelineStage)
export class PipelineStageFeedbacksController extends BaseController<PipelineStageFeedback> {
    override className: string = this.constructor.name;

    constructor(protected service: PipelineStageFeedbacksService,
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

    @Get('by-progress/:pipelineProgressId')
    async getByPipelineProgressId(
        @Param('pipelineProgressId') pipelineProgressId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Pipeline Progress id', pipelineProgressId);
        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const feedbacks = await this.service.getFeedbackByPipelineProgressId(pipelineProgressId, requestingUser._id);
            
            if (!feedbacks || feedbacks.length === 0) {
                return response.status(200).json(null);
            }
            return response.status(200).json(feedbacks);
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
            console.log(`Position Stage Feedback:`, body);
            const requestingUser = this.utilitiesService.getUser(request);
            const feedbackEntity: PipelineStageFeedback = {
                ...body,
                positionId: new ObjectId(body.positionId),
                stageId: new ObjectId(body.stageId),
                userId: new ObjectId(requestingUser._id),
                talentId: new ObjectId(body.talentId),
                pipelineProgressId: new ObjectId(body.pipelineProgressId),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date(),
            }

            const feedback = await this.service.createAsync(feedbackEntity);
            console.log('Created Position Stage Feedback:', feedback);
            return response.status(200).send(feedback);
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Update pipelineStage', request.body);

        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const feedback: PipelineStageFeedback = {
                ...body,
                _id: new ObjectId(body._id),
                userId: new ObjectId(body.userId),
                positionId: new ObjectId(body.positionId),
                talentId: new ObjectId(body.talentId),
                pipelineProgressId: new ObjectId(body.pipelineProgressId),
                stageId: new ObjectId(body.stageId),
                createdBy: new ObjectId(requestingUser._id),
                modifiedBy: new ObjectId(requestingUser._id),
            }
            body._id = new ObjectId(body._id);
            body.positionId = new ObjectId(body.positionId);
            body.pipelineProgressId = new ObjectId(body.pipelineProgressId);
            body.talentId = new ObjectId(body.talentId);
            body.stageId = new ObjectId(body.stageId);
            body.userId = new ObjectId(body.userId);
            body.createdBy = new ObjectId(body.createdBy);
            body.createdDate = new Date(body.createdDate);
            body.modifiedBy = new ObjectId(requestingUser._id);
            body.modifiedDate = new Date();
            const result = await this.service.updateAsync(body);
            console.log('updated Position Stage', result);
            return response.status(200).json(result);
        } catch (error) {
            console.error(error);
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
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log('Delete pipeline stage with id:', id);
            const deleted = await this.service.deleteAsync(id);
            return response.status(200).json(deleted);
        } catch (err) {
            console.error(err);
            return response.status(500).json(err);
        }
    }
}