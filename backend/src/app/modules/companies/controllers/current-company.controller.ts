import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { Company } from '../models/company';
import { CompanyVersion } from '../models/company-versions';
import { CurrentCompany } from '../models/current-company';
import { CurrentCompanyService } from '../services/current-company.service';

const multer = require('multer');

@Controller('current-company')
@SetMetadata('entityModel', CurrentCompany)
export class CurrentCompanyController extends BaseController<CurrentCompany> {
    override className: string = this.constructor.name;

    constructor(protected service: CurrentCompanyService,
        protected awsFileShareService: AWSFileShareService,
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
        console.log("CurrentCompanyController", filterParams, request.publicAccessFilter);
        console.log("publicAccessFilter ownerAccessFilter", this.className, request.publicAccessFilter, request.ownerAccessFilter);

        return await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('user/:userId')
        async getByUserIdAsync(
        @Param('userId') userId: string,
        @Req() request: Request,
        @Res() response: Response
        ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('user/:userId')", userId);

        try {
            const userIdObj = new ObjectId(userId);
            console.log("userIdObj", userIdObj);
            const currentCompany = await this.service.getByUserIdAsync(userIdObj);
            if (!currentCompany) {
                return response.status(200).json(null); 
            }
            return response.status(200).json(currentCompany);
        } catch (error) {
            console.error('Error fetching current company by userId:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get()
    async getAllVerified(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        return await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
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
        @Ip() ip,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('CurrentCompanyController', body);
        
        try {
            const user = this.utilitiesService.getUser(request);
            body.companyId = new ObjectId(body.companyId);
            const company: CurrentCompany = { ...body };

            company.userId = new ObjectId(user._id);
            company.createdBy = new ObjectId(user._id);
            company.createdDate = new Date();

            console.log(`CurrentCompanyController ${company} `, company);
            const item = await this.service.createAsync(company);
            return response.status(200).json(item);
        } catch (error) {
            console.error('Error creating current company:', error);
            return response.status(500).json(error);
        }
    }

    @Put()
    @HttpCode(204)
    @UseInterceptors(FileInterceptor('file', {
        storage: multer.memoryStorage()
    }))
    async putPayload(
        @Body('info') info: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
    ): Promise<any> {
        const user = this.utilitiesService.getUser(request);

        const company: Company = {
            ...info,
            modifiedBy: user._id,
        }

        return await super.putAsync(JSON.stringify(company), request, response, ip);
    }

    @Put(':id')
    @HttpCode(204)
    async put(
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Update current company', request.body);
        try {
            const user = this.utilitiesService.getUser(request);
            const company: CurrentCompany = { ...body };
            company.modifiedBy = user._id;
            const result = await this.service.updateAsync(company);
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
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('CurrentCompanyController', body, _id, propertyName);
        
        try {
            const user = this.utilitiesService.getUser(request);            
            body.modifiedBy = new ObjectId(user._id);

            const keyValue = JSON.parse(JSON.stringify(body));
            const property = Object.keys(keyValue)[0];
            const value = Object.values(keyValue)[0];
            const item = await this.service.patchAsync(_id, property, value);
            console.log(`CurrentCompanyController patch ${item} `);
            return response.status(200).json(item);
        } catch (error) {
            console.error('Error creating current company:', error);
            return response.status(500).json(error);
        }
    }

    @Delete(':_id')
    @HttpCode(204)
    async delete(
        @Param('_id') _id: any,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const objectId = new ObjectId(_id);
            const result = await this.service.deleteAsync(objectId);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }
}