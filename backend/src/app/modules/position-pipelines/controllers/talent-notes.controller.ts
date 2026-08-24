import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ObjectId } from 'bson';
import { TalentNote } from '../models/talent-note';
import { TalentNotesService } from '../services/talent-notes.service';
import { User } from '../../users/models/user';

@Controller('talent-notes')
@SetMetadata('entityModel', TalentNote)
export class TalentNotesController extends BaseController<TalentNote> {
    override className: string = this.constructor.name;

    constructor(protected service: TalentNotesService,
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
            const notesResponse = await this.service.getByPositionIdTalentIdAsync(positionId, talentId);

            return response.status(200).json(notesResponse);
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
            console.log(`Talent Note:`, body);
            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            body.talentId = new ObjectId(body.talentId);
            body.positionId = new ObjectId(body.positionId);
            body.userId = new ObjectId(requestingUser._id);
            body.createdBy = new ObjectId(requestingUser._id);
            body.createdDate = new Date();

            const talentNoteItem = await this.service.createAsync(body);
            console.log('Created Talent Note:', talentNoteItem);
            return response.status(200).send(talentNoteItem);
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
        console.log('Update talent note', request.body);

        try {
            const talentNote: TalentNote = {...body};

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }
            
            talentNote._id = new ObjectId(talentNote._id);
            talentNote.talentId = new ObjectId(talentNote.talentId);
            talentNote.positionId = new ObjectId(talentNote.positionId);
            talentNote.userId = new ObjectId(talentNote.userId);
            talentNote.createdBy = new ObjectId(talentNote.createdBy);
            talentNote.modifiedBy = new ObjectId(requestingUser._id);
            talentNote.modifiedDate = new Date();

            const result = await this.service.updateAsync(talentNote);
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
            console.log('Delete talent note with id:', id);
            const deleted = await this.service.deleteAsync(id);
            return response.status(200).json(deleted);
        } catch (err) {
            console.error(err);
            return response.status(500).json(err);
        }
    }
}