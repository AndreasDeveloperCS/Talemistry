import { Body, Controller, Delete, Get, Header, HttpCode, Ip, NotFoundException, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs/promises';
import Handlebars from 'handlebars';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { UtilitiesService } from '../../core/services/utilities.service';
import { User } from '../../users/models/user';
import { TalentProfile } from '../models/talent-profile';
import { CustomCVService } from '../services/custom-cv.service';
import { TalentProfileService } from '../services/talent-profile.service';
import { getBaseDir } from '../../../common/utils/path.helper';

@Controller('custom-cv')
// @SetMetadata('entityModel', TalentProfile)
export class CustomCVController //extends BaseController<TalentProfile> 
{
    //override className = this.constructor.name;

    constructor(
        protected cvService: CustomCVService,
        protected utilitiesService: UtilitiesService,
        protected service: TalentProfileService,
        protected moduleRef: ModuleRef,
    ) {
        //super(service, moduleRef);
    }

    private async renderHtml(cvData: any, themeName = 'public'): Promise<string> {
        const tplPath = path.join(getBaseDir('templates'), 'templates', themeName, 'cv.hbs');
        const cssPath = `/assets/themes/${themeName}/style.css`; // served via ServeStatic
        const tplSrc = await fs.readFile(tplPath, 'utf-8');
        const template = Handlebars.compile(tplSrc, { noEscape: true });

        // example helper: date range
        Handlebars.registerHelper('range', (from: string, to?: string) => `${from} – ${to || 'Present'}`);

        return template({ ...cvData, cssPath });
    }

    @Get(':slug')
    @Header('Content-Type', 'text/html; charset=utf-8')
    async html(@Param('slug') slug: string, @Res() res: Response) {
        const cv = await this.cvService.getBySlug(slug);
        if (!cv) throw new NotFoundException('CV not found');
        const html = await this.renderHtml(cv, cv.theme || 'default');
        res.send(html);
    }

    @Get(':slug.pdf')
    async pdf(@Param('slug') slug: string, @Res() res: Response) {
        const cv = await this.cvService.getBySlug(slug);
        if (!cv) throw new NotFoundException('CV not found');

        const html = await this.renderHtml(cv, cv.theme || 'default');

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${slug}.pdf"`);
        res.send(pdf);
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

            // console.log(this.constructor.name, filtering);

            const result = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering
            );
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).json(error);
        }
    }


    @Get(':_id')
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.CANDIDATE, ROLES.HR, ROLES.HM, ROLES.SE)
    async getByIdAsync(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            //const accessFilter = this.getAccessFilters(request);
            console.log('param _id', _id);
            //const userId = new ObjectId(_id);
            const result = await this.service.getByUserIdAsync(_id);
            console.log('getByIdAsync result', result);
            response.status(200).json(result);
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    @Post()
    @HttpCode(201)
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.CANDIDATE, ROLES.HR, ROLES.HM, ROLES.SE)
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            const requestingUser: User = this.utilitiesService.getUser(request);
            const entity: TalentProfile = request.body;
            const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");
            const userId = entity.user._id;

            entity.userId = new ObjectId(userId);
            entity.createdBy = requestingUser._id;
            entity.createdDate = new Date();

            let exisitingEntity: TalentProfile = await this.service.getExistingEntity(userId, entity);

            console.log('talent-profile 2', requestingUser, exisitingEntity, entity);

            entity.userId = new ObjectId(userId);
            if (!entity.user.userId) {
                entity.user.userId = new ObjectId(userId);
            }
            if (!entity.user.createdBy) {
                entity.user.createdBy = new ObjectId(requestingUser._id);
            }
            if (exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
                const paginationResult = await this.service.updateAsync(entity);
                console.log(entity, paginationResult);
                return response.status(204).json(paginationResult);
            }

            if (!exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
                const paginationResult = await this.service.createAsync(entity);
                console.log(entity, paginationResult);
                return response.status(201).json(paginationResult);
            }

            if (requestingUser._id != userId && !isAdmin) {
                return response.status(403).json({ message: `User is not authorized to request or change this data` });
            }
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Put(':_id')
    @HttpCode(204)
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.CANDIDATE, ROLES.HR, ROLES.HM, ROLES.SE)
    async edityId(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        next: NextFunction
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            //console.log('edity Id', request.body);
            const result = await this.service.updateAsync(request.body);
            // console.log('updated Candidate User Profile', result);
            return response.status(200).json(result);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Patch(':_id')
    // @Roles(ROLES.SA, ROLES.ADMIN)
    async patch(
        @Param('_id') _id: string,
        @Query('propertyName') propertyName: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            // console.log(_id, propertyName, body);
            const keyValue = JSON.parse(JSON.stringify(body));
            const property = Object.keys(keyValue)[0];
            const value = Object.values(keyValue)[0];
            // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);
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
            const result = await this.service.deleteAsync(_id);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).send(error);
        }
    }

}
