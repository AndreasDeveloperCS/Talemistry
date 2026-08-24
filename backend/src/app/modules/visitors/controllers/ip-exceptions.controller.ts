import { Request, Response } from 'express';
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const { Worker, isMainThread, parentPort } = require('worker_threads');

import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ObjectId } from 'bson';
import { Filtering } from '../../../helpers/filtering';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { IpException } from '../models/ip-exception';
import { IpExceptionsService } from '../services/ip-exceptions.service';
import { VisitorsService } from '../services/visitors.service';
import { ModuleRef } from '@nestjs/core';

@Controller('ip-exceptions')
@SetMetadata('entityModel', IpException)
export class IpExceptionsController extends BaseController<IpException> {

  constructor(protected service: IpExceptionsService,
    protected moduleRef: ModuleRef,
    protected visitorsService: VisitorsService) {
    super(service, moduleRef)
  }

  @Get()
  async getAllAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
  }

  @Post()
  async save
    (
      @Body() body: any,
      @Req() req: Request,
      @Res() res: Response
    ) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const ipException: IpException = body;
      const result = await this.visitorsService.getRecordByValueAsync('ip', ipException.ip);
      const ips = await this.visitorsService.getIps();
      const filteredIps = ips.filter(item => item._id.ip == ipException.ip);

      ipException.frequency = (filteredIps && filteredIps.length > 0) ? filteredIps[0]?.count : 1;
      ipException.city = result.city;
      ipException.country = result.country;
      const checkIfExists = await this.service.getRecordByValueAsync('ip', ipException.ip);
      if (!checkIfExists) {
        const item = await this.service.createAsync(ipException);
        return res.status(200).json(item);
      } else {
        return res.status(200).json({});
      }

    } catch (error) {
      console.error(`Could not add info about visitor to database`, error);
      return res.status(500).send(error);
    }
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

    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const info = body;
      const result = await this.service.updateAsync(info);
      return response.status(200).send(result);

    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Patch(':_id')
  async patchAsync(
    @Param('_id') _id: string,
    @Query('propertyName') propertyName: string,
    @Body() body: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];
      const id = new ObjectId(_id);
      const result = await this.service.patchAsync(_id, property, value);

      return response.status(200).send(result);
    } catch (error) {
      console.error(`Could not patch ${propertyName}: ${error}`);
      return response.status(500).send(error);
    }
  }

  @Delete(':_id')
  async deleteAsyncById(
    @Param('_id') _id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: string) {
    // console.log('deleteAsyncById', _id, body);

    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const id: ObjectId = new ObjectId(_id);
      const result = await this.service.deleteAsync(id);
      res.status(200).json({
        requestBody: req.body,
        result: result
      });
    } catch (error) {
      console.error(error);

      res.status(500).send(error);
    }
  }

}

