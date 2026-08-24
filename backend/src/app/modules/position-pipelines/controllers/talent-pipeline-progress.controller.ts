import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { StageType } from '../models/pipeline-stage';
import { TalentPipelineProgress } from '../models/talent-pipeline-progress';
import { TalentPipelineProgressService } from '../services/talent-pipeline-progress.service';

@Controller('talent-pipeline-progress')
@SetMetadata('entityModel', TalentPipelineProgress)
export class TalentPipelineProgressController extends BaseController<TalentPipelineProgress> {
    override className: string = this.constructor.name;

    constructor(protected service: TalentPipelineProgressService,
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
        console.log('TalentPipelineProgressController getAllAsync');
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('position/:positionId/grouped')
    async getGroupedPipelineStagesByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const result = await this.service.getGroupedTalentPipelineStagesByPositionId(
                positionId,
                requestingUser._id
            );

            return response.status(200).json(result ?? null);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talent/:talentId/position/:positionId')
    async getTalentPipelineStagesByPositionId(
        @Param('positionId') positionId: string,
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const result = await this.service.getTalentPipelineStagesByPositionId(positionId, new ObjectId(talentId));
            return response.status(200).json(result ?? null);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId/full')
    async getByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline position id', positionId);
        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const talentPipeline = await this.service.getTalentPipelineByPositionId(positionId, requestingUser._id);
            if (!talentPipeline) {
                return response.status(200).json(null);
            }
            return response.status(200).json(talentPipeline);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId/stage/:stageType')
    async getApplicantsByPositionIdStage(
        @Param('positionId') positionId: string,
        @Param('stageType') stageType: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline getApplicantsByPositionIdStage position id stage type', positionId, stageType);

        try {
            const requestingUser = this.utilitiesService.getUser(request);
            const data = await this.service.getApplicantsByPositionIdStage(positionId, stageType as StageType, requestingUser._id);
            return response.status(200).json(data);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('stage/:stageType')
    async getApplicantsByStage(
        @Param('stageType') stageType: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline getApplicantsByStage stage type', stageType);

        try {
            const requestingUser = this.utilitiesService.getUser(request);
            const data = await this.service.getApplicantsByStage(stageType as StageType, requestingUser._id);
            return response.status(200).json(data);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talent/:talentId/full')
    async getByTalentId(
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline talent id', talentId);
        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const talentPipeline = await this.service.getTalentPipelineByTalentId(talentId, requestingUser._id);
            if (!talentPipeline) {
                return response.status(200).json(null);
            }
            return response.status(200).json(talentPipeline);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talent/:talentId/position/:positionId/full')
    async getByTalentIdPositionId(
        @Param('talentId') talentId: string,
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline talent id position id', talentId, positionId);
        try {
            const requestingUser = this.utilitiesService.getUser(request);

            const talentPipeline = await this.service.getTalentPipelineByTalentIdPositionId(talentId, positionId, requestingUser._id);
            if (!talentPipeline) {
                return response.status(200).json(null);
            }
            return response.status(200).json(talentPipeline);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('contacts/:recruiterId')
    async getRecruiterContacts(
        @Param('recruiterId') userId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getRecruiterContacts user id', userId);
        try {
            const contacts = await this.service.getTalentsContactsListByPositions(userId);
            console.log('Pipeline by user id', contacts);
            if (!contacts) {
                return response.status(200).json(null);
            }
            return response.status(200).json(contacts);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('positions/by-stage/:stageType')
    async getAppliedPositionsReachedStage(
        @Param('stageType') stageType: string,
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;
            const requestingUser = this.utilitiesService.getUser(request);
            const result = await this.service.getPositionsReachedStageByTalentIdPaginated(
                requestingUser._id, stageType as StageType, paginationParams, sorting, filtering);
            console.log('Talent Positions reached stage', stageType, JSON.stringify(result, null, 2));

            return response.status(200).json(result);

        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('positions/by-talent-id/:talentId')
    async getAppliedPositionsByTalentId(
        @Param('talentId') talentId: string,
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

            const result = await this.service.getAppliedPositionsByTalentIdPaginated(
                talentId, paginationParams, sorting, filtering);
            console.log('Talent Applied Positions', JSON.stringify(result, null, 2));

            return response.status(200).json(result);

        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('positions/applied-ids/:talentId')
    async getAppliedPositionIds(
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const ids = await this.service.getAppliedPositionIds(talentId);
            return response.status(200).json(ids);
        } catch (error) {
            console.error('getAppliedPositionIds', error);
            return response.status(500).json(error);
        }
    }

    @Get('contacts/by-position-id/:positionId')
    async getRecruiterContactsForPosition(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getRecruiterContactsForPosition position id', positionId);
        try {
            const contacts = await this.service.getTalentsContactsByPositionId(positionId);

            if (!contacts) {
                return response.status(200).json(null);
            }
            
            return response.status(200).json(contacts);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talents/:userId')
    async getTalentsByUserId(
        @Param('userId') userId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline user id', userId);
        try {
            const talents = await this.service.getAllTalentsContactsByRecruiterId(userId);
            console.log('Talents by user id', talents);
            if (!talents) {
                return response.status(200).json(null);
            }
            return response.status(200).json(talents);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('talentsForPosition/:userId')
    async getTalentsForPositionByUserId(
        @Param('userId') userId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('TalentPipeline user id', userId);
        try {
            const talents = await this.service.getTalentsContactsListByPositions(userId);
            console.log('Talents by user id', talents);
            if (!talents) {
                return response.status(200).json(null);
            }
            return response.status(200).json(talents);
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
            console.log(`TalentPipelineProgressController Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const talentPipeline: TalentPipelineProgress = { ...body };
            talentPipeline.userId = new ObjectId(body.userId);
            talentPipeline.positionId = new ObjectId(body.positionId);
            talentPipeline.positionPipelineId = new ObjectId(body.positionPipelineId);
            talentPipeline.talentId = new ObjectId(body.talentId);
            talentPipeline.stageId = new ObjectId(body.stageId);
            talentPipeline.createdBy = new ObjectId(requestingUser._id);
            console.log('TalentPipeline to create', talentPipeline);

            const createdPipeline = await this.service.createAsync(talentPipeline);

            console.log('Created TalentPipeline', createdPipeline);
            return response.status(200).send(createdPipeline);
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
        console.log('Update talentPipeline version', request.body);
        try {
            const user = this.utilitiesService.getUser(request);
            const talentPipeline: TalentPipelineProgress = {
                ...body,
                _id: new ObjectId(body._id),
                userId: new ObjectId(body.userId),
                positionId: new ObjectId(body.positionId),
                positionPipelineId: new ObjectId(body.positionPipelineId),
                talentId: new ObjectId(body.talentId),
                stageId: new ObjectId(body.stageId),
                finalDecisionBy: body.finalDecisionBy ? new ObjectId(body.finalDecisionBy) : undefined,
                createdBy: new ObjectId(body.createdBy),
                modifiedBy: new ObjectId(user._id),
            };
            console.log('talentPipeline before update', talentPipeline);
            const result = await this.service.updateAsync(talentPipeline);
            console.log('Updated talentPipeline', result);
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
        console.log('Delete talentPipeline id', id);
        return await super.deleteAsync(id, request, response);
    }
}
