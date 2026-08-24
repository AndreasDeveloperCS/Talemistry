import { Controller, Get, InternalServerErrorException, Param, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomFilter, Filtering, FilterRule } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { OpenPosition } from '../models/open-position';
import { PositionsService } from '../services/positions.service';
import { ModuleRef } from '@nestjs/core';

@Controller('verified-positions')
@SetMetadata('entityModel', OpenPosition)
export class VerifiedPositionsController extends BaseController<OpenPosition> {

    constructor(protected service: PositionsService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    @Get()
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

            const filter: CustomFilter = {
                property: 'isVerified',
                rule: FilterRule.EQUALS,
                value: true
            }

            if (!filtering.some(item => item.property == filter.property && item.value == filter.value)) {
                filtering.push(filter);
            }

            const paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
                //'OpenPositions'
            );

            return response.status(200).json(paginationResult);
        } catch (error) {
            return response.status(500).json(error);
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
            const result = await this.service.getByIdAsync(_id, accessFilter);
            if (result.isVerified) {
                return response.status(200).json(result);
            } else {
                throw new InternalServerErrorException('Requested Postion is not verified or you have not access to it.');
            }

        } catch (error) {

            return response.status(200).send(error);
        }
    }

}
