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
import { Country } from '../models/countries';
import { CountriesService } from '../services/countries.service';
import { ModuleRef } from '@nestjs/core';

@Controller('countries')
@SetMetadata('entityModel', Country)
export class CountriesController extends BaseController<Country> {
  constructor(protected service: CountriesService,
    protected moduleRef: ModuleRef) {
    super(service, moduleRef);
  }

  @Get()
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {

    await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
  }

  @Get(':_id')
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
  async getById(
    @Param('_id') _id: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    return await super.getByIdAsync(_id, request, response, ip);
  }

  @Post()
  @HttpCode(201)
  // @Roles(ROLES.SA, ROLES.ADMIN, ROLES.HM, ROLES.HR, ROLES.CANDIDATE, ROLES.SE)
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