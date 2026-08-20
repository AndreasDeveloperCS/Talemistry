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
  Res
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { InterviewService } from '../services/interview.service';
import { PaginationParams, Pagination } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { Interview } from '../model/interview';
import { ModuleRef } from '@nestjs/core';

@Controller('interviews')
export class InterviewController extends BaseController<Interview> {

  constructor(protected service: InterviewService,
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

  @Get('getByPositionId/:positionId')
  async getByPositionId(
    @Param('positionId') positionId: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip): Promise<any> {
    try {
      const interviews = await this.service.getByPositionId(positionId);
      response.header('Access-Control-Allow-Origin', request.headers.origin);
      return response.json({ result: interviews });
    } catch (error) {
      return response.status(500).json({ error: error.message });
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

