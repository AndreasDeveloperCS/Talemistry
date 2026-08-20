import { BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, HttpCode, Ip, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, Patch, Post, Put, Query, Req, Res, SetMetadata, UnauthorizedException, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { EmailService } from '../../email/services/email.service';
import { FileInfo } from '../../cvs/models/file-info';
import { Company, CompanyPhotoGalleryItem } from '../models/company';
import { CompanyVersion } from '../models/company-versions';
import { CompanyData } from '../models/company-data';
import { CompanyVerifiedService } from '../services/company-verified.service';
import { User } from '../../users/models/user';
import { CompanyVersionService } from '../services/company-versions.service';

const multer = require('multer');

@Controller('companies-verified')
@SetMetadata('entityModel', Company)
export class CompanyVerifiedController extends BaseController<Company> {
    override className: string = this.constructor.name;

    private publicImagePathPrefix: string = 'https://d6nrcrbzehdnr.cloudfront.net';

    constructor(protected service: CompanyVerifiedService,
        private emailService: EmailService,
        protected awsFileShareService: AWSFileShareService,
        private companyVersionService: CompanyVersionService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    private async resolveCompanyForGallery(id: string, user?: User): Promise<Company> {
        try {
            return await this.service.getByIdAsync(id, []);
        } catch (e: any) {
            const isNotFound = e instanceof NotFoundException || e?.status === 404;
            if (!isNotFound) throw e;

            const byVersion = await this.service.getByCompanyVersionIdAsync(id);
            if (byVersion) return byVersion;

            // Only auto-create when authenticated (owners/editors flow).
            if (!user) throw e;

            const version = await this.companyVersionService.getByIdAsync(id, []);
            return await this.service.createFromCompanyVersionAsync(id, version as any, user);
        }
    }

    private makeSafeFileName(originalName: string): string {
        const safe = (originalName || 'image')
            .replace(/\\/g, '_')
            .replace(/\//g, '_')
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9._-]/g, '');
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return `${unique}-${safe}`;
    }

    private canEditCompany(user: User | undefined, company: Company): boolean {
        if (!user) return false;
        const userId = new ObjectId(user._id);
        const email = user.email?.toLowerCase();

        if (company?.userId && new ObjectId(company.userId).toString() === userId.toString()) return true;
        if (company?.createdBy && new ObjectId(company.createdBy).toString() === userId.toString()) return true;

        const sharedEditIds = (company.sharedEditIds ?? []).map((x: any) => new ObjectId(x).toString());
        if (sharedEditIds.includes(userId.toString())) return true;

        const sharedEditEmails = (company.sharedEditEmails ?? []).map(e => (e || '').toLowerCase());
        if (email && sharedEditEmails.includes(email)) return true;

        return false;
    }

    @Get(':_id/photo-gallery')
    async getPhotoGallery(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const user = this.utilitiesService?.getUser(request);
        const company = await this.resolveCompanyForGallery(_id, user);

        const canEdit = this.canEditCompany(user, company);
        if (!company.isVerified && !canEdit) {
            return response.status(404).json({ message: 'Company not found' });
        }

        const items = (company.photoGallery ?? [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.createdDate ?? 0).getTime() - new Date(b.createdDate ?? 0).getTime());

        return response.status(200).json({ canEdit, items });
    }

    @Get(':_id/photo-gallery/can-edit')
    async canEditPhotoGallery(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const user = this.utilitiesService?.getUser(request);
        const company = await this.resolveCompanyForGallery(_id, user);
        return response.status(200).json({ canEdit: this.canEditCompany(user, company) });
    }

    @Post(':_id/photo-gallery')
    @UseInterceptors(FilesInterceptor('files', 50, { storage: multer.memoryStorage() }))
    async uploadPhotoGallery(
        @Param('_id') _id: string,
        @Body('caption') caption: string,
        @Req() request: Request,
        @Res() response: Response,
        @UploadedFiles() files: Express.Multer.File[]
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const user = this.utilitiesService?.getUser(request);
        if (!user) throw new UnauthorizedException('Authentication required');

        const company = await this.resolveCompanyForGallery(_id, user);
        if (!this.canEditCompany(user, company)) {
            throw new UnauthorizedException('Not allowed to edit this company');
        }

        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        const accepted = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        for (const f of files) {
            if (!accepted.includes(f.mimetype)) {
                throw new BadRequestException(`Unsupported file type: ${f.mimetype}`);
            }
            if (f.size > 1024 * 1024 * 20) {
                throw new BadRequestException(`File too large: ${f.originalname}`);
            }
        }

        const folder = `photo-gallery/${_id}`;
        const current = (company.photoGallery ?? []).slice();
        const maxOrder = current.reduce((acc, it) => Math.max(acc, it.order ?? 0), 0);
        let order = maxOrder + 1;

        const newItems: CompanyPhotoGalleryItem[] = [];
        for (const f of files) {
            const safeName = this.makeSafeFileName(f.originalname);
            const aws = await this.awsFileShareService.uploadFile('companies', f, folder, safeName);

            newItems.push({
                id: new ObjectId().toString(),
                key: aws.Key,
                url: aws.Location,
                originalName: aws.originalName ?? f.originalname,
                mimetype: aws.mimetype ?? f.mimetype,
                size: aws.size ?? f.size,
                caption: caption ?? '',
                order: order++,
                createdDate: new Date(),
                createdBy: new ObjectId(user._id),
            });
        }

        const updated = current.concat(newItems);
        const saved = await this.service.patchAsync(_id, 'photoGallery', updated);

        return response.status(200).json({ items: saved.photoGallery ?? updated });
    }

    @Patch(':_id/photo-gallery/:photoId')
    async updatePhotoGalleryItem(
        @Param('_id') _id: string,
        @Param('photoId') photoId: string,
        @Body() body: { caption?: string; order?: number },
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const user = this.utilitiesService?.getUser(request);
        if (!user) throw new UnauthorizedException('Authentication required');

        const company = await this.resolveCompanyForGallery(_id, user);
        if (!this.canEditCompany(user, company)) {
            throw new UnauthorizedException('Not allowed to edit this company');
        }

        const items = (company.photoGallery ?? []).slice();
        const idx = items.findIndex(i => i.id === photoId);
        if (idx < 0) {
            throw new BadRequestException('Photo not found');
        }

        if (typeof body.caption === 'string') {
            items[idx].caption = body.caption;
        }

        if (typeof body.order === 'number' && Number.isFinite(body.order)) {
            items[idx].order = body.order;
        }

        const saved = await this.service.patchAsync(_id, 'photoGallery', items);
        return response.status(200).json({ items: saved.photoGallery ?? items });
    }

    @Delete(':_id/photo-gallery/:photoId')
    async deletePhotoGalleryItem(
        @Param('_id') _id: string,
        @Param('photoId') photoId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const user = this.utilitiesService?.getUser(request);
        if (!user) throw new UnauthorizedException('Authentication required');

        const company = await this.resolveCompanyForGallery(_id, user);
        if (!this.canEditCompany(user, company)) {
            throw new UnauthorizedException('Not allowed to edit this company');
        }

        const items = (company.photoGallery ?? []).slice();
        const idx = items.findIndex(i => i.id === photoId);
        if (idx < 0) {
            throw new BadRequestException('Photo not found');
        }

        const [removed] = items.splice(idx, 1);
        if (removed?.key) {
            try {
                await this.awsFileShareService.deleteFile(removed.key);
            } catch (e) {
                console.error('Failed to delete S3 object for gallery item', removed.key, e);
            }
        }

        const saved = await this.service.patchAsync(_id, 'photoGallery', items);
        return response.status(200).json({ items: saved.photoGallery ?? items });
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
        console.log("Companies Controller");
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
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
    @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
        @UploadedFile('file', new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }),
            ]
        })) file: Express.Multer.File | undefined
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('Companies-Versions Controller', body);
        const user = this.utilitiesService.getUser(request);
        const company: Company = {
            ...body,
            userId: user._id,
            createdBy: user._id,
        }
        const companyItem = await this.service.createAsync(company)
        try {
            this.emailService.sendMessage(this.emailService.getInternalNotificationMessageWithAttachment(file, company, `New Company Created: ${company.data.companyName}`));
        } catch (ex) {
            console.error(ex);
            //return response.status(500).json(ex);
        }
        const companyData = new CompanyData();
        if (file) {
            try {
                const subFolderName = `${companyData.companyName}/${user._id}/logo`;
                // console.log('AWSFileShareService', coverLetter.coverLetterFileInfo);
                const awsResult = await this.awsFileShareService.uploadFile('companies-logo', file, subFolderName, file.originalname);

                const logoFileInfo = new FileInfo();
                logoFileInfo.originalName = file.originalname;

                logoFileInfo.mimetype = file.mimetype;
                logoFileInfo.size = file.size;
                logoFileInfo.filename = file.filename;
                logoFileInfo.extension = file.originalname?.substring(file.originalname?.lastIndexOf('.') + 1);

                logoFileInfo.destination = file.destination;
                logoFileInfo.cloudPath = `${this.publicImagePathPrefix}/${awsResult.Key}`;

                logoFileInfo.Location = awsResult.Location;
                logoFileInfo.ETag = awsResult.ETag;
                logoFileInfo.Bucket = awsResult.Bucket;
                logoFileInfo.Key = awsResult.Key;

                companyData.logo = logoFileInfo;
            } catch (ex) {
                console.error(ex);
                return response.status(500).json(ex);
            }
            companyItem.data = companyData;
        }

        const companyItemUpdated = await this.service.updateAsync(company);
        return response.status(200).json(companyItem);
    }

    @Put()
    @HttpCode(204)
    @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
    async putPayload(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
        @UploadedFile('file', new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }),
            ]
        })) file: Express.Multer.File | undefined
    ): Promise<any> {
        const user = this.utilitiesService.getUser(request);

        const company: Company = {
            ...body,
            modifiedBy: user._id,
        }

        return await super.putAsync(JSON.stringify(company), request, response, ip);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
    @HttpCode(204)
    async put(
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip,
        @UploadedFile('file', new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }),
            ]
        })) file: Express.Multer.File | undefined
    ): Promise<any> {
        console.log('company', body);
        const user = this.utilitiesService.getUser(request);
        const company: Company = { ...body, modifiedBy: user._id }
        return await super.putAsync(JSON.stringify(company), request, response, ip);
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