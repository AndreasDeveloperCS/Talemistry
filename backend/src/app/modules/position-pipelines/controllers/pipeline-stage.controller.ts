import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { PipelineStage } from '../models/pipeline-stage';
import { PipelineStagesService } from '../services/pipeline-stages.service';
import { ObjectId } from 'bson';

@Controller('pipeline-stages')
@SetMetadata('entityModel', PipelineStage)
export class PipelineStagesController extends BaseController<PipelineStage> {
    override className: string = this.constructor.name;

    constructor(protected service: PipelineStagesService,
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
            console.log(`Position Stage:`, body);
            body.positionId = new ObjectId(body.positionId);
            body.positionPipelineId = new ObjectId(body.positionPipelineId);
            const positionPipelineItem = await this.service.createAsync(body);
            console.log('Created Position Stage:', positionPipelineItem);
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
        console.log('Update pipelineStage', request.body);

        try {
            body._id = new ObjectId(body._id);
            body.positionId = new ObjectId(body.positionId);
            body.positionPipelineId = new ObjectId(body.positionPipelineId);
            const result = await this.service.updateAsync(body);
            console.log('updated Position Stage', result);
            return response.status(200).json(result);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Patch(':stageId')
    @HttpCode(200)
    async updateStage(
        @Param('stageId') stageId: string, 
        @Body() updateDto: Partial<any>, 
        @Res() res: Response
    ): Promise<any> {
        try {
            const updated = await this.service.updateStage(stageId, updateDto);
            return res.status(200).json(updated);
        } catch (err) {
            console.error(err);
            return res.status(500).json(err);
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
            const deleted = await this.service.deleteStageAsync(id);
            return response.status(200).json(deleted);
        } catch (err) {
            console.error(err);
            return response.status(500).json(err);
        }
    }
}
