import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  SetMetadata
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { City } from '../models/city';
import { CityService } from '../services/city.service';
import { ModuleRef } from '@nestjs/core';

const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');
const { resolve } = require('path');
const mime = require('mime-types');
const util = require('util');

@Controller('cities')
@SetMetadata('entityModel', City)
export class CityController extends BaseController<City> {

  constructor(protected service: CityService, protected moduleRef: ModuleRef) {
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

    return super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
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
