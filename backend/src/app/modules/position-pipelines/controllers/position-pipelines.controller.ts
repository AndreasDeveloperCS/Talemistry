import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { PositionPipeline } from '../models/position-pipeline';
import { PositionPipelinesService } from '../services/position-pipelines.service';

@Controller('position-pipelines')
@SetMetadata('entityModel', PositionPipeline)
export class PositionPipelinesController extends BaseController<PositionPipeline> {
    override className: string = this.constructor.name;

    constructor(
        protected service: PositionPipelinesService,
        protected moduleRef: ModuleRef,
    ) {
        super(service, moduleRef);
        console.log('Pipeline Constructor', this.className);
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
        console.log('Pipeline position id', positionId);
        try {
            const pipeline = await this.service.getPipelineWithStagesByPositionId(positionId);
            if (!pipeline) {
                const requestingUser: User = this.utilitiesService?.getUser(request);
                if (!requestingUser) {
                    return response.status(401).json({ message: 'Unauthorized' });
                }
                const createdPipeline = await this.service.createPipelineWithStages(
                    positionId,
                    requestingUser._id,
                );
                console.log('Created Pipeline', createdPipeline);
                return response.status(200).send(createdPipeline);
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
            console.log(`PositionPipeline Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const createdPipeline = await this.service.createPipelineWithStages(
                body.positionId,
                requestingUser._id,
                body.stages, 
            );

            console.log('Created Pipeline', createdPipeline);
            return response.status(200).send(createdPipeline);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Patch(':pipelineId/stages/order')
    @HttpCode(200)
    async reorderStages(
        @Param('pipelineId') pipelineId: string,
        @Body() body: { orderedStageIds: string[] },
        @Req() request: Request,
        @Res() response: Response,
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            await this.service.updatePipelineStagesOrder(pipelineId, body.orderedStageIds);
            return response.status(200).json({ message: 'Order updated' });
        } catch (err) {
        console.error(err);
            return response.status(500).json(err);
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
            const positionPipeline: PositionPipeline = { ...body };
            positionPipeline.modifiedBy = new ObjectId(user._id);
            const result = await this.service.updateAsync(positionPipeline);
            console.log('Updated positionPipeline', result);
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

    @Delete('position/:positionId')
    @HttpCode(200)
    async deleteByPositionId(@Param('positionId') positionId: string, @Res() response: Response) {
        try {
            const result = await this.service.deletePipelineByPositionId(positionId);
            return response.status(200).json(result);
        } catch (err) {
        console.error(err);
            return response.status(500).json(err);
        }
    }
}