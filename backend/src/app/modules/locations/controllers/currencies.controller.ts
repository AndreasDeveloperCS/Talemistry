import {
  Body, Controller, Delete, Get, HttpCode,
  Ip,
  Param,
  Patch, Post, Put, Query, Req, Res,
  SetMetadata
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { Currency } from '../models/currency';
import { CurrenciesService } from '../services/currencies.service';
import { ModuleRef } from '@nestjs/core';

@Controller('currencies')
@SetMetadata('entityModel', Currency)
export class CurrenciesController extends BaseController<Currency> {
  constructor(protected service: CurrenciesService,
    protected moduleRef: ModuleRef) {
    super(service, moduleRef);
  }

  @Get()
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.RC, ROLES.CANDIDATE, ROLES.JA, ROLES.SE)
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    //console.log(this.constructor.name, 'get all');

    response.header('Access-Control-Allow-Origin', request.headers.origin);
    const user = this.utilitiesService.getUser(request);
    //this.service.bulkUpdate({ createdBy: user._id });
    //console.log(this.constructor.name, 'currencies have been updated');
    const responseData = await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    return responseData;
  }

  @Get(':_id')
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD, ROLES.HM, ROLES.HR, ROLES.RC, ROLES.CANDIDATE, ROLES.JA, ROLES.SE)
  async getById(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    return await super.getByIdAsync(_id, request, response, ip);
  }

  @Post()
  @HttpCode(201)
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.RC, ROLES.CANDIDATE, ROLES.JA, ROLES.SE)
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
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
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
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
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
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
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
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.MD)
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    return await super.deleteAsync(id, request, response);
  }
}



