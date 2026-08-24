
import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { Permission } from '../models/permission';
import { PermissionsService } from '../services/permissions.service';
import { ModuleRef } from '@nestjs/core';

@Controller('permissions')
@SetMetadata('entityModel', Permission)
export class PermissionsController extends BaseController<Permission> {
    override className: string = this.constructor.name;

    constructor(
        protected service: PermissionsService,
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

    @Get('roleCode/:roleCode')
    async getPermissionByRoleCode(
        @Param('roleCode') roleCode: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        //console.log('getPermissionByRoleCode', roleCode);
        try {

            let result = await this.service.getPermissionsByRoleCode(roleCode);
            console.log('getPermissionByRoleCode 1', result, roleCode);
            if (result.length === 0) {
                const role = await this.roleService.getRolesByCode(roleCode);
                result = await this.service.getPermissionsByRoleId(role._id);
                console.log('getPermissionByRoleCode 2', result, roleCode, role);
            }

            response.status(200).json(result);
            return result;
        } catch (error) {
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

    @Put('bulk/:roleId')
    async bulkUpdatePermissions(
        @Param('roleId') roleId: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ) {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        const userId = this.utilitiesService.getUser(request)._id;
        //console.log('userId', userId, roleId, body);
        const permissions: Permission[] = body;
        return await this.service.bulkUpdate(new ObjectId(roleId), permissions, new ObjectId(userId));
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