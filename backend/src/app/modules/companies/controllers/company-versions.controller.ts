import { Body, Controller, Delete, FileTypeValidator, Get, HttpCode, Ip, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Put, Query, Req, Res, SetMetadata, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { EmailService } from '../../email/services/email.service';
import { FileInfo } from '../../cvs/models/file-info';
import { Company } from '../models/company';
import { CompanyVersion } from '../models/company-versions';
import { CompanyVersionService } from '../services/company-versions.service';
import { CompanyData } from '../models/company-data';
import { FilterRule } from '../../../helpers/filtering';
import { CompanyLogosService } from '../services/company-logos.service';
import { User } from '../../users/models/user';

const multer = require('multer');

@Controller('companies-versions')
@SetMetadata('entityModel', CompanyVersion)
export class CompanyVersionsController extends BaseController<CompanyVersion> {
    override className: string = this.constructor.name;

    private publicImagePathPrefix: string = 'https://d6nrcrbzehdnr.cloudfront.net';

    constructor(protected service: CompanyVersionService,
        private emailService: EmailService,
        private companyLogosService: CompanyLogosService,
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
        console.log("Companies Controller", filterParams, request.publicAccessFilter);
        console.log("publicAccessFilter ownerAccessFilter", this.className, request.publicAccessFilter, request.ownerAccessFilter);

        //request.publicAccessFilter = [{ property: 'isVerified', rule: FilterRule.EQUALS, value: false }];

        return await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
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
            const companiesByUserId = await this.service.getByUserIdAsync(userIdObj);
            if (!companiesByUserId) {
                return response.status(200).json(null); 
            }
            return response.status(200).json(companiesByUserId);
        } catch (error) {
            console.error('Error fetching companies by userId:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Get Company by id', _id);
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Post()
    @HttpCode(201)
    @UseInterceptors(FileInterceptor('logo'))
    async post(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try{
            console.log('Companies-Versions Controller', body, file);
            const user = this.utilitiesService.getUser(request);
            const info = typeof body.info === 'string' ? JSON.parse(body.info) : body.info;

            const uploaded = await this.companyLogosService.uploadCompanyLogo(
                file,
                user._id  
            );

            console.log('Company Logo uploaded', uploaded);

            const company: CompanyVersion = { ...info };

            company.userId = new ObjectId(user._id);
            company.createdBy = new ObjectId(user._id);
            company.version = 0;
            company.isVerified = false;
            company.createdDate = new Date();

            console.log(`Companies-Versions Controller ${company} `, company);
            const result = await this.service.createCompanyVersion(company, uploaded);
            try {
                this.emailService.sendMessage(this.emailService.getInternalNotificationMessageWithAttachment(uploaded, company, `New Company Version Created: ${company.data.companyName}`));
            } catch (ex) {
                console.error(ex);
                //return response.status(500).json(ex);
            }
        
            return response.status(200).json(result);
        } catch (error) {
            console.error(error);
            return response.status(500).send({
                status: 'ERROR',
                message: error.message,
                error,
            });
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
        // @UploadedFile('file', new ParseFilePipe({
        //     validators: [
        //         new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        //         new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }),
        //     ]
        // })) file: Express.Multer.File | undefined
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
    @UseInterceptors(FileInterceptor('logo'))
    async updateCompany(
        @UploadedFile() file: Express.Multer.File,
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const user: User = this.utilitiesService.getUser(request);
            const info = typeof body.info === 'string' ? JSON.parse(body.info) : body.info;
            console.log('Update company version', id, info);

            const existing = await this.service.getByIdAsync(id);
            if (!existing) {
                throw new Error("Company not found");
            }
            info.userId = new ObjectId(user._id);
            info.modifiedBy = new ObjectId(user._id);

            let uploadedLogo = null;

            if (file) {
                uploadedLogo = await this.companyLogosService.updateCompanyLogo(
                    file,
                    user._id,
                    existing.data?.companyLogo
                );
            }

            const updatePayload = {
                ...info,
                ...(uploadedLogo ? { companyLogo: uploadedLogo } : {})
            };

            const result = await this.service.updateCompanyVersion(id, updatePayload);

            return response.status(200).json(result);
        } catch (error) {
            console.error('Error updating company version', error);
            return response.status(500).send({
                status: 'ERROR',
                message: error.message,
                error,
            });
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
        console.log('Company-Versions patch', body, propertyName, _id)
        return await super.patchAsync(_id, propertyName, body, request, response);
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
            const existing = await this.service.getByIdAsync(_id);
            const deletedLogo = await this.companyLogosService.deleteOldPhoto(existing.data?.companyLogo);
            console.log('Deleted logo', deletedLogo);
            const result = await this.service.deleteAsync(objectId);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }
}