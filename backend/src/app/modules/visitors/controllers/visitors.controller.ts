import { NextFunction, Request, Response } from 'express';
const fs = require("fs");
const path = require("path");
const multer = require('multer');
const { Worker, isMainThread, parentPort } = require('worker_threads');

import { Body, Controller, Delete, Get, Ip, Param, Post, Query, Req, Res, SetMetadata } from '@nestjs/common';

import { CustomFilter, Filtering, FilterRule } from '../../../helpers/filtering';
import { PaginatedResource, Pagination, PaginationParams } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseController } from '../../base/controllers/base.controller';
import { IpException } from '../models/ip-exception';
import { Visitor } from '../models/visitor';
import { IpExceptionsService } from '../services/ip-exceptions.service';
import { VisitorsService } from '../services/visitors.service';
import { ModuleRef } from '@nestjs/core';

@Controller('visitors')
@SetMetadata('entityModel', Visitor)
export class VisitorsController extends BaseController<Visitor> {

  constructor(protected service: VisitorsService,
    protected moduleRef: ModuleRef,
    protected exceptionsService: IpExceptionsService) {
    super(service, moduleRef)
  }

  @Get('ips')
  async getIpsAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

      await this.addIpExceptionsFilter(filtering);

      const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);

      return response.status(200).json(paginationResult);

    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('ip')
  async getIpAsync(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {

    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const ips = await this.service.getIps();
      return response.status(200).json(ips);
    } catch (error) {
      return response.status(500).json(error);
    }

  }

  @Get('cities')
  async getCitiesAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

      await this.addIpExceptionsFilter(filtering);
      const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);

      return response.status(200).json(paginationResult);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('city')
  async getCityAsync(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const cities = await this.service.getCities();

      return response.status(200).json(cities);
    } catch (error) {
      return response.status(500).json(error);
    }
  }
  @Get('regions')
  async getRegionsAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

      await this.addIpExceptionsFilter(filtering);
      const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);

      return response.status(200).json(paginationResult);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('region')
  async getRegionAsync(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const regions = await this.service.getRegionNames();
      return response.status(200).json(regions);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('countries')
  async getCountriesAsync(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {

      const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;

      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

      await this.addIpExceptionsFilter(filtering);

      const paginationResult = await this.service.getCountries(paginationParams, sorting, filtering);

      return response.status(200).json(paginationResult);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('country')
  async getCountryAsync(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const sorting: Sorting = {
        property: "_id",
        direction: "ASC"
      };

      const filtering: Filtering = [];

      const paginationParams: Pagination = { page: 0, limit: 1, offset: 0, size: 1 };

      const counties = await this.service.getCountries(paginationParams, sorting, filtering);
      return response.status(200).json(counties);
    } catch (error) {
      return response.status(500).json(error);
    }
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

      const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

      await this.addIpExceptionsFilter(filtering);

      const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);

      return response.status(200).json(paginationResult);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  async addIpExceptionsFilter(filtering: Filtering) {

    const items = await this.getIpExceptionCollection();
    const filter: CustomFilter = {
      property: "ip",
      rule: FilterRule.NOT_IN,
      value: items.join(',')
    };

    filtering.push(filter);
  }

  async getIpExceptionCollection(): Promise<string[]> {
    let page = 0;
    let size = 500;
    let limit = size;
    let offset = 0;
    const sorting: Sorting = {
      property: 'dateTimeCreated',
      direction: 'DESC'
    };
    const filtering: Filtering = [{
      property: "isActive",
      rule: FilterRule.EQUALS,
      value: true
    }];

    let items = [];
    let response: PaginatedResource<Partial<IpException>>;
    let pagination: Pagination;

    do {
      offset = page * limit;
      pagination = { page, limit, size, offset };
      response = await this.exceptionsService.getAllAsync(pagination, sorting, filtering);

      items = items.concat(response.items);

      page = page + 1;
    } while (response?.totalItems > items.length)

    return items.map((item: IpException) => item.ip);
  }

  replaceRule(filtering: Filtering, ips: any[]) {
    const frequencyFilter: CustomFilter = filtering.filter((filter: CustomFilter) => {
      return filter.property == "frequency"
    })[0];
    let filteredIps: any[] = [];
    switch (frequencyFilter.rule) {
      case FilterRule.GREATER_THAN:
        filteredIps = ips.filter((ipRecord: any) => {
          return ipRecord.count > frequencyFilter.value
        });
        break;
      case FilterRule.GREATER_THAN_OR_EQUALS:
        filteredIps = ips.filter((ipRecord: any) => {
          return ipRecord.count >= frequencyFilter.value
        });
        break;
      case FilterRule.LESS_THAN:
        filteredIps = ips.filter((ipRecord: any) => {
          return ipRecord.count < frequencyFilter.value
        });
        break;
      case FilterRule.LESS_THAN_OR_EQUALS:
        filteredIps = ips.filter((ipRecord: any) => {
          return ipRecord.count <= frequencyFilter.value
        });
        break;
      case FilterRule.EQUALS:
        filteredIps = ips.filter((ipRecord: any) => {
          return ipRecord.count == frequencyFilter.value
        });
        break;
    }

    const newFilter = this.createNewFilter(filteredIps);
    filtering.push(newFilter);
    const index = filtering.indexOf(frequencyFilter);
    filtering.splice(index, 1);
  }

  convertArrayToString(filteredIps: any[]) {
    let filterValue = filteredIps?.map((item: any) => {
      return item._id
    }).join(',');
    filterValue = filteredIps?.map((item: any) => item._id).join(',');
    return filterValue;
  }

  createNewFilter(filteredIps: any[]) {
    let filterValue = this.convertArrayToString(filteredIps);
    //console.log('createNewFilter', filteredIps, filterValue);
    const newFilter: CustomFilter = {
      property: 'ip',
      rule: FilterRule.IN,
      value: filterValue
    };
    //console.log('createNewFilter', newFilter);

    return newFilter;
  }

  @Post()
  async save
    (
      @Body() body: any,
      @Req() req: Request,
      @Res() res: Response,
      @Ip() ip
    ) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const visitor: Visitor = body;
      const ips = await this.service.getIps();
      const filteredIps = ips.filter(item => item._id.ip == visitor.ip);

      visitor.frequency = (filteredIps && filteredIps.length > 0) ? filteredIps[0]?.count + 1 : 1;

      const item = await this.service.createAsync(visitor);
      try {
        //const result = await this.service.bulkPatch(visitor.ip, visitor.frequency);
        //const result2 = await this.service.bulkUpdate(ips);
      } catch (error) {
        console.error(error);
      }

      return res.status(200).json(item);

    } catch (error) {
      console.error(`Could not add info about visitor to database`, error);

      return res.status(500).send(error);
    }
  }

  @Delete(':id')
  async deleteById(
    @Param("id") id: any,
    @Req() req: Request,
    @Res() res: Response,
    next: NextFunction) {

    res.header('Access-Control-Allow-Origin', req.headers.origin);
    try {
      const result = await this.service.deleteAsync(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(error);
    }
  }
}