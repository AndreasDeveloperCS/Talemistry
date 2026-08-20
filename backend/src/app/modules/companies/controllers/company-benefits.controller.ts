import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { User } from '../../users/models/user';
import { CompanyBenefit } from '../models/company-benefits';
import { CompanyBenefitsService } from '../services/company-benefits.service';

@Controller('company-benefits')
@SetMetadata('entityModel', CompanyBenefit)
export class CompanyBenefitsController extends BaseController<CompanyBenefit> {
    override className: string = this.constructor.name;

    constructor(protected service: CompanyBenefitsService,
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
            console.log(`CompanyBenefit Inserted entity:`, body);
            const requestingUser: User = this.utilitiesService?.getUser(request);
            console.log(`CompanyBenefit Inserted entity userId:`, body, requestingUser._id);
            const insertedEntity: CompanyBenefit = await this.service.createIfNotExists(body, requestingUser._id);
            console.log(`CompanyBenefit Inserted entity:`, insertedEntity);

            return response.status(insertedEntity ? 201 : 200).send(insertedEntity);
        } catch (error: any) {
            if (error?.code === 11000) {
                const existing = await this.service['model']
                    .findOne({ benefit: body.benefit?.trim() })
                    .collation({ locale: 'en', strength: 2 })
                    .lean();
                return response.status(200).send(existing);
            }

            console.error(error);
            return response.status(500).send(error);
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