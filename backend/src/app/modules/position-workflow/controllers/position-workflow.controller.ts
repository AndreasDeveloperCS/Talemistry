import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { PositionWorkflow } from '../models/position-workflow';
import { PositionWorkflowService } from '../services/position-workflow.service';
import { User } from '../../users/models/user';

@Controller('position-workflow')
@SetMetadata('entityModel', PositionWorkflow)
export class PositionWorkflowController extends BaseController<PositionWorkflow> {
    override className: string = this.constructor.name;
    
    constructor(protected service: PositionWorkflowService,
        protected moduleRef: ModuleRef,
    ) {
        super(service, moduleRef);
        console.log('PositionWorkflow Controller', this.className);
    }

    @Get()
    async getAllAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        console.log('PositionPipelinesController getAllAsync');
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('position/:positionId')
    async getByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Pipeline by position id', positionId);
        try {
            const id = new ObjectId(positionId);
            const pipeline = await this.service.getByPositionId(id);
            console.log('Pipeline by position id', pipeline);
            if (!pipeline) {
                return response.status(200).json(null);
            }
            return response.status(200).json(pipeline);
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
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log(`PositionPipeline Inserted entity:`, body);
            const requestingUser: User = this.utilitiesService?.getUser(request);
            console.log(`PositionPipeline Inserted entity userId:`, body, requestingUser._id);
            const positionPipeline: PositionWorkflow = { ...body };

            positionPipeline.userId = new ObjectId(requestingUser._id);
            positionPipeline.createdBy = new ObjectId(requestingUser._id);
            positionPipeline.createdDate = new Date();

            console.log(`PositionPipeline Controller ${positionPipeline} `, positionPipeline);
            //return response.status(200).send(positionPipeline);

            const positionPipelineItem = await this.service.createAsync(positionPipeline);
            return response.status(200).send(positionPipelineItem);
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
        console.log('Update positionPipeline version', request.body);
        try {
            const user = this.utilitiesService.getUser(request);
            const positionPipeline: PositionWorkflow = { ...body };
            positionPipeline.modifiedBy = new ObjectId(user._id);
            const result = await this.service.updateAsync(positionPipeline);
            // console.log('updated Candidate User Profile', result);
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
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.deleteAsync(id, request, response);
    }
}
