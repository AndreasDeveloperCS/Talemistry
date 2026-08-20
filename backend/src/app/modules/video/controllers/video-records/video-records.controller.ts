import { Body, Controller, Delete, Get, HttpCode, Ip, Param, ParseIntPipe, Patch, Post, Put, Query, Req, Res, SetMetadata, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { ObjectId } from 'bson';
import { VideoRecord } from '../../models/video-record';
import { VideoRecordService } from '../../services/video-record/video-record.service';
import { BaseController } from '../../../base/controllers/base.controller';
import { Pagination, PaginationParams } from '../../../../helpers/pagination';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../../../users/models/user';

@Controller('video-records')
@SetMetadata('entityModel', VideoRecord)
export class VideoRecordsController extends BaseController<VideoRecord> {
    override className: string = this.constructor.name;

    constructor(protected service: VideoRecordService,
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
    @UseInterceptors(FileInterceptor('file'))
    async uploadChunk(
        @Req() request: Request,
        @Res() response: Response,
        @UploadedFile() file: Express.Multer.File,
        @Body('recordingId') recordingId: string,
        @Body('chunkIndex', ParseIntPipe) chunkIndex: number,
        @Body('isLast') isLast: string,
        @Body('interviewId') interviewId?: string,
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('VideoRecords Controller');
        try {
            const last = isLast === 'true';
            console.log('uploadChunk', file);
            const user: User = this.utilitiesService.getUser(request);
            const result = await this.service.handleChunk({
                recordingId,
                chunkIndex,
                buffer: file.buffer,
                isLast: last,
                interviewId,
                userId: user._id,
            });
            console.log('VideoRecords Controller', result);

            return response.status(200).send(result);
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
            const videoRecord: VideoRecord = updateDto as VideoRecord;
            const updated = await this.service.updateAsync(videoRecord);
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
            const deleted = await this.service.deleteAsync(id);
            return response.status(200).json(deleted);
        } catch (err) {
            console.error(err);
            return response.status(500).json(err);
        }
    }
}