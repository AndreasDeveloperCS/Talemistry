import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { NextFunction, Request, Response } from 'express';
import { CustomFilter, Filtering, FilterRule } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { EmailService } from '../../email/services/email.service';
import { TalentPipelineProgressService } from '../../position-pipelines/services/talent-pipeline-progress.service';
import { OpenPosition } from '../models/open-position';
import { PositionsService } from '../services/positions.service';

@Controller('positions')
@SetMetadata('entityModel', OpenPosition)
export class PositionsController extends BaseController<OpenPosition> {
    constructor(protected service: PositionsService,
        private emailService: EmailService,
        protected talentPipelineProgressService: TalentPipelineProgressService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
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
            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const filter: CustomFilter = {
                property: 'isVerified',
                rule: FilterRule.EQUALS,
                value: true
            }

            if (!filtering.some(item => item.property == filter.property && item.value == filter.value)) {
                filtering.push(filter);
            }

            const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);
            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('saved')
    async getAllSavedAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('saved')");
        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const filter: CustomFilter = {
                property: 'isVerified',
                rule: FilterRule.EQUALS,
                value: true
            }

            if (!filtering.some(item => item.property == filter.property && item.value == filter.value)) {
                filtering.push(filter);
            }

            const user = this.utilitiesService.getUser(request);
            const paginationResult = await this.service.getAllSavedAsync(user, paginationParams, sorting, filtering);
            console.log('All saved positions', paginationResult);

            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('hr')
    async getAllAsyncForHr(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("publicAccessFilter ownerAccessFilter", this.className, request.publicAccessFilter, request.ownerAccessFilter);
        console.log('Get hr positions', sortParams, filterParams);

        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const accessFilter = this.getAccessFilters(request);
            console.log('Before open positions', sorting, filtering);
            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                accessFilter
            );
            const userId = this.utilitiesService?.getUser(request)._id;
            const applicantsCountMap = await this.talentPipelineProgressService
                .getApplicantsCountForPositionsByUserId(userId);

            const itemsWithApplicantsCount = paginationResult.items.map(pos => ({
                ...pos,
                applicantsCount: applicantsCountMap[pos._id.toString()] || 0
            }));

            console.log('Positions', {
                ...paginationResult,
                items: itemsWithApplicantsCount
            });

            return response.status(200).json({
                ...paginationResult,
                items: itemsWithApplicantsCount
            });

        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('hr/funnel')
    async getRecruitmentFunnels(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {

        try {

            const sorting: Sorting = sortParams
                ? JSON.parse(sortParams)
                : undefined;

            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const accessFilter = this.getAccessFilters(request);

            // 1. Get paginated positions
            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                accessFilter
            );

            const positions = paginationResult.items;

            const positionIds = positions.map(
                p => p._id.toString()
            );

            // 2. Get funnel statistics ONLY for current positions
            const funnelMap =
                await this.talentPipelineProgressService
                    .getFunnelsForPositions(positionIds);

            // 3. Merge
            const items = positions.map(position => {

                const funnel =
                    funnelMap[position._id.toString()];

                return {
                    positionId: position._id,
                    positionTitle: position.title,
                    positionStatus: position.status,

                    applicantsCount:
                        funnel?.applicantsCount || 0,

                    pipelineStagesInfo:
                        funnel?.pipelineStagesInfo || []
                };
            });

            return response.status(200).json({
                ...paginationResult,
                items
            });

        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('hr/dashboard-stats')
    async getHrDashboardStats(
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const user = this.utilitiesService.getUser(request);
            const result = await this.service.getHrDashboardStats(user._id, user.email);
            console.log('hr/dashboard-stats', result);

            return response.status(200).json(result);

        } catch (error) {
            console.error('hr/dashboard-stats error', error);
            return response.status(500).json(error);
        }
    }

    @Get('pipeline-health')
    async getPipelineHealthStats(
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const user = this.utilitiesService.getUser(request);
            const result = await this.service.getPipelineHealthStats(user._id);
            console.log('pipeline-health', result);

            return response.status(200).json(result);

        } catch (error) {
            console.error('pipeline-health error', error);
            return response.status(500).json(error);
        }
    }

    @Get('top-matches')
    async getTopPositionMatches(
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const user = this.utilitiesService.getUser(request);
            const result = await this.service.getTopPositionMatches(user);
            console.log('top-matches', result);

            return response.status(200).json(result);

        } catch (error) {
            console.error('top-matches error', error);
            return response.status(500).json(error);
        }
    }

    @Get('verified')
    async getAllVerifiedAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            // const filter: CustomFilter = {
            //     property: 'isVerified',
            //     rule: FilterRule.EQUALS,
            //     value: true
            // }
            // if (!filtering.some(item => item.property == filter.property && item.value == filter.value)) {
            //     filtering.push(filter);
            // }
            const accessFilter = this.getAccessFilters(request);
            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                accessFilter
            );

            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('user/:userId')
    async getByUserIdAsync(
        @Param('userId') _id: string,
        @Req() request: Request,
        @Res() response: Response): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log("Positions getByUserIdAsync", _id);
            const result = await this.service.getByUserIdAsync(_id);
            console.log("Positions getByUserIdAsync result", result);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }

    @Get(':_id')
    async getByIdAsync(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const accessFilter = this.getAccessFilters(request);
            console.log("@Get(':_id') accessFilter", _id, accessFilter);
            const result = await this.service.getByIdAsync(_id, accessFilter);
            console.log("@Get(':_id') result", result);
            console.log('positions getByIdAsync result', result);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
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
            console.log('New Position', body);
            const entity: OpenPosition = request.body;
            const user = this.utilitiesService.getUser(request);
            entity.userId = new ObjectId(user._id);
            entity.createdBy = new ObjectId(user._id);
            console.log('@Post() position', entity);
            const paginationResult = await this.service.createAsync(entity);
            console.log('paginationResult', paginationResult);
            try {
                this.emailService.sendMessage(
                    this.emailService.getNotificationMessageAboutNewOpenPosition(
                        this.emailService.buildNewPositionHtml(paginationResult))
                    );
            } catch (ex) {
                console.error(ex);
                //return response.status(500).json(ex);
            }
            return response.status(200).json(paginationResult);
        } catch (error) {
            response.header('Access-Control-Allow-Origin', request.headers.origin);
            return response.status(500).json(error);
        }
    }

    @Put(':_id')
    @HttpCode(204)
    async edityId(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        next: NextFunction
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Update Position', _id);
        try {
            const user = this.utilitiesService.getUser(request);
            request.body.userId = new ObjectId(user._id);
            request.body.createdBy = new ObjectId(user._id);
            request.body.modifiedBy = new ObjectId(user._id);
            const result = await this.service.updateAsync(request.body);
            console.log('Updated position', result);
            return response.status(200).json(result);
        } catch (error) {
            response.header('Access-Control-Allow-Origin', request.headers.origin);
            return response.status(500).json(error);
        }
    }

    @Patch(':_id')
    // // @Roles(ROLES.SA, ROLES.ADMIN)
    async patch(
        @Param('_id') _id: string,
        @Query('propertyName') propertyName: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log('Patch value', _id);
            const keyValue = JSON.parse(JSON.stringify(body));
            const property = Object.keys(keyValue)[0];
            const value = Object.values(keyValue)[0];
            const id = new ObjectId(_id);

            const result = await this.service.patchAsync(_id, property, value);
            return response.status(200).send(result);
        } catch (error) {
            console.error(`Could not patch ${propertyName}: ${error}`);
            return response.status(500).send(error);
        }
    }

    @Delete(':_id')
    @HttpCode(204)
    async deleteById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
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