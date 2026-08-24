import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { ROLES } from '../../../common/enums';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { EmailService } from '../../email/services/email.service';
import { UsersService } from '../../users/services/user.service';
import { VerificationService } from '../../users/services/verification.service';
import { Lead } from '../models/lead';
import { CustomerBriefService } from '../services/customer-brief.service';
import { LeadsService } from '../services/leads.service';
import { User } from '../../users/models/user';
import { ModuleRef } from '@nestjs/core';

@Controller('leads')
@SetMetadata('entityModel', Lead)
export class LeadsController extends BaseController<Lead> {
    override className: string = this.constructor.name;

    constructor(protected leadService: LeadsService,
        private verificationService: VerificationService,
        protected briefService: CustomerBriefService,
        private userService: UsersService,
        private emailService: EmailService,
        private readonly jwtService: JwtService,
        protected moduleRef: ModuleRef) {
        super(leadService, moduleRef);
    }

    @Get()
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.CRM, ROLES.CS, ROLES.LD)
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
    // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.CRM, ROLES.CS, ROLES.LD)
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Post()
    @HttpCode(201)
    // // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        console.log(body);

        // TODO:

        // 6. Create Brief record with reference to lead
        // - create tocken baced to be user  80 or 82 => criete brief  link - split, 
        // 
        // lead id - const token = await this.jwtService.signAsync({ user: existingUser }, {}); 
        // 7. If Lead  records includes email of delegation send email to this email with invitation to fill the brief and adding into cc (copy) the email of Lead and our email services@evryka.org 
        // 8. Return Empty just created new breif  record to frontend and redirect using router.navigate[briefs, _briefID]

        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const message = this.emailService.leadEmailNotification(body);
            const notification = this.emailService.sendMessage(message);
            console.log('notification', notification);
            const leadAlreadyUser: User = await this.userService.findByEmail(body.email);
            console.log('notification', leadAlreadyUser);
            if (leadAlreadyUser) {
                if (leadAlreadyUser.role.includes(ROLES.LD)) {
                    leadAlreadyUser.role.unshift(ROLES.LD)
                }
                if (leadAlreadyUser.role.includes(ROLES.LEAD)) {
                    leadAlreadyUser.role.unshift(ROLES.LEAD)
                }
                await this.userService.updateAsync(leadAlreadyUser);
            }
            const createdLeadUser = await this.createUserIfNotExisting(leadAlreadyUser, body);
            const userID = leadAlreadyUser._id ?? createdLeadUser._id;
            const leadEntity: Lead = this.generateLeadBody(body, userID);

            const lead = await this.service.createAsync(leadEntity);
            console.log('lead', lead);

            return response.status(200).send(lead);

        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    private generateLeadBody(body: any, userID) {
        const leadEntity: Lead = body;

        leadEntity.userId = userID;
        leadEntity.createdBy = userID;
        leadEntity.positionRole = body.role;

        return leadEntity;
    }

    private async createUserIfNotExisting(isLeadAlreadyUser: User, body: any): Promise<User> {
        if (!isLeadAlreadyUser) {
            console.log('isLeadAlreadyUser', isLeadAlreadyUser);

            const user = await this.userService.createUser(body.firstname, body.lastname, body.email, body.phone, [ROLES.LD, ROLES.LEAD]);
            console.log('user', user);
            this.verificationService.createEmailVerificationRequest(user);
            return user;
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