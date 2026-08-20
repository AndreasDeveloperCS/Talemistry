import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { NextFunction, Request, Response } from 'express';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { UsersService } from '../../users/services/user.service';
import { TalentProfile } from '../models/talent-profile';
import { TalentProfileService } from '../services/talent-profile.service';

@Controller('talent-profile')
@SetMetadata('entityModel', TalentProfile)
export class TalentProfileController extends BaseController<TalentProfile> {
    override className = this.constructor.name;

    constructor(
        protected service: TalentProfileService,
        protected moduleRef: ModuleRef,
        protected userService: UsersService
    ) {
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

            // console.log(this.constructor.name, filtering);
            //const deleteRes = await this.service.deleteAsync('6904e7e8621825c9114ddf89');

            const result = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering
            );
            console.log('Talent profiles list', result);
            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getByIdAsync(
        @Param('_id') _id: any,
        @Req() request: Request,
        @Res() response: Response): Promise<any> {

        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log('id', _id);

            //const accessFilter = this.getAccessFilters(request);
            const userId = this.service.getObjectId(_id);
            const user = await this.userService.getByIdAsync(_id);
            let profile = await this.service.getByUserIdAsync(userId);
            if(!profile) {
                const newEntity = new TalentProfile();
                const requestingUser = this.utilitiesService.getUser(request);
                newEntity.user = user;
                newEntity.userId = new ObjectId(requestingUser._id);
                newEntity.createdBy = new ObjectId(requestingUser._id);
                newEntity.createdDate = new Date();
                profile = await this.service.createAsync(newEntity);
            }
            console.log('Profile', profile, !profile);
            //profile.user = user;
            //console.log('getByIdAsync Profile', profile);
            return response.status(200).json(profile);
        } catch (error) {
            console.error(error);
            return response.status(500).send(error);
        }
    }

    @Get('full/:id')
    @HttpCode(HttpStatus.OK)
    async getFullProfileById(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const requestingUser = this.utilitiesService.getUser(request);
            const talentProfile = await this.service.getPublicProfile(id, requestingUser);
            return response.status(200).json(talentProfile);
        } catch (error) {
            console.error('getFullProfileById error:', error);
            return response.status(500).json({ message: 'Internal server error', error });
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
            const requestingUser: User = this.utilitiesService.getUser(request);
            const entity: TalentProfile = request.body;
            const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");
            const userId = this.service.getObjectId(entity.user._id);
            console.log('talent-profile 2', userId, entity.user, entity);
            entity.userId = new ObjectId(userId);
            entity.createdBy = new ObjectId(requestingUser._id);
            entity.createdDate = new Date();

            let exisitingEntity: TalentProfile = await this.service.getExistingEntity(userId, entity);

            console.log('talent-profile 2', requestingUser, exisitingEntity, entity);

            if (!entity.user.userId) {
                entity.user.userId = new ObjectId(userId);
            }
            if (!entity.user.createdBy) {
                entity.user.createdBy = new ObjectId(requestingUser._id);
            }
            if (exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
                console.log('talent-profile update', entity, exisitingEntity);
                const paginationResult = await this.service.updateAsync(entity);
                console.log(entity, paginationResult);
                return response.status(204).json(paginationResult);
            }

            if (!exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
                console.log('talent-profile create', entity, exisitingEntity);
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
    async edityId(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        next: NextFunction
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            console.log('id', _id);
            const requestingUser: User = await this.utilitiesService.getUser(request);
            const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");
            const entity: TalentProfile = request.body;
            console.log('entity', entity);
            const userId = this.service.getObjectId(entity.userId);
            
            console.log('requestingUser._id', requestingUser._id, 'userdId', userId, requestingUser._id != userId);
            if (requestingUser._id != userId && !isAdmin) {
                return response.status(403).json({ message: `User is not authorized to request or change this data` });
            }

            entity.userId = new ObjectId(userId);
            entity.createdBy = new ObjectId(requestingUser._id);
            entity.modifiedDate = new Date();
            entity.modifiedBy = new ObjectId(requestingUser._id);
            console.log('PUT talent-profile update requestingUser', requestingUser);

            let exisitingEntity: TalentProfile = await this.service.getExistingEntity(userId, entity);

            console.log('PUT talent-profile update exisitingEntity', exisitingEntity);

            if (!entity.user.userId) {
                entity.user.userId = new ObjectId(userId);
            }

            if (!entity.user.createdBy) {
                entity.user.createdBy = new ObjectId(requestingUser._id);
            }
            if (exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
                console.log('PUT talent-profile update', entity, exisitingEntity);
                const paginationResult = await this.service.updateAsync(entity);
                console.log(entity, paginationResult);
                return response.status(204).json(paginationResult);
            }
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {
            // console.log(_id, propertyName, body);
            const keyValue = JSON.parse(JSON.stringify(body));
            const property = Object.keys(keyValue)[0];
            const value = Object.values(keyValue)[0];
            // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);
            const id = new ObjectId(_id);
            console.log('Talent Profile patch', property, value);
            const result = await this.service.patchAsync(id, property, value);
            console.log('Talent Profile patch', result);

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
