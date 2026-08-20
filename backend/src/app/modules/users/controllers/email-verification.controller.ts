import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';

import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { VerificationRequest } from '../models/user-verification';
import { UsersService } from '../services/user.service';
import { VerificationService } from '../services/verification.service';
import { ModuleRef } from '@nestjs/core';

@Controller('verification-requests')
// @SetMetadata('entityModel', VerificationRequest)
export class VerificationRequestsController extends BaseController<VerificationRequest> {
    override className: string = this.constructor.name;

    constructor(protected service: VerificationService,
        protected moduleRef: ModuleRef,
        private userService: UsersService) {
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
        // const verificationRequest = await super.getByIdAsync(_id, request, response, ip);
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log('getById 1', _id);
            const verificationRequest = await this.service.getByIdAsync(_id);
            console.log('getById 2', _id, verificationRequest);
            const accessFilter = this.getAccessFilters(request);
            const user = await this.userService.getByIdAsync(verificationRequest.userId, accessFilter);
            console.log(user);
            response.status(200).json({
                _id: verificationRequest._id,
                email: user.email,
                isVerified: verificationRequest.isVerified,
            });
        } catch (error) {
            console.log('Error in getById:', error);

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
        return await super.postAsync(body, request, response, ip);
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