import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { EmailService } from '../../email/services/email.service';
import { UsersService } from '../../users/services/user.service';
import { Brief } from '../models/brief';
import { CustomerBrief } from '../models/customer-brief';
import { CustomerBriefService } from '../services/customer-brief.service';
import { LeadsService } from '../services/leads.service';
import { Lead } from '../models/lead';
import { ModuleRef } from '@nestjs/core';

@Controller('customer-brief')
@SetMetadata('entityModel', CustomerBrief)
export class CustomerBriefController extends BaseController<CustomerBrief> {

    override className: string = this.constructor.name;

    constructor(protected briefService: CustomerBriefService,
        protected leadService: LeadsService,
        private userService: UsersService,
        private emailService: EmailService,
        private readonly jwtService: JwtService,
        protected moduleRef: ModuleRef) {
        super(briefService, moduleRef);
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
        try {
            console.log(body, 'body');
            const briefData = body;
            const leadId = briefData?.userId;

            const lead: Lead = await this.leadService.getByIdAsync(leadId);
            console.log('Lead', lead);

            if (body != undefined) {
                const token = await this.jwtService.signAsync({
                    stakeholder: {
                        _id: lead._id,
                        email: lead.email,
                        // role: ROLES.LD
                    }
                }, {
                    secret: process.env.JWT_SECRET,
                    expiresIn: '30d'
                });
                console.log('brief', token);
                const briefTemplate: CustomerBrief = {
                    userId: new ObjectId(lead._id),
                    accessToken: token,
                    sharedReadIds: [],
                    sharedReadEmails: lead.emailSharing ? [lead.emailSharing] : [],
                    sharedEditIds: [],
                    sharedEditEmails: lead.emailSharing ? [lead.emailSharing] : [],
                    createdBy: new ObjectId(lead._id),
                    createdDate: new Date(Date.now()),
                    title: briefData.title,
                    description: briefData.description,
                    isIncluded: false,
                    modifiedDate: undefined,
                }
                const existingBriefs: Brief[] = await this.briefService.getByLeadIdAsync(lead._id);
                const brief = await this.briefService.createAsync(briefTemplate);
                console.log('created brief', brief, existingBriefs);
                const message = this.emailService.briefFillingInvitation(lead, brief);
                const notification = this.emailService.sendMessage(message);
                console.log('brief', brief.sharedEditEmails.length > 0);
                if (brief.sharedEditEmails.length > 0) {
                    const message = this.emailService.briefFillingDelegationInvitation(body, brief);
                    const notification = this.emailService.sendMessage(message)
                }

                return response.status(200).send({ brief, existingBriefs: existingBriefs });
            }
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    @Put()
    @HttpCode(204)
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
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
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
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
    // @Roles(ROLES.SA, ROLES.ADMIN)
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
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.deleteAsync(id, request, response);
    }
}