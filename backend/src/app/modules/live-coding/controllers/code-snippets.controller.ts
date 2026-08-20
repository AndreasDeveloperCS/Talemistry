import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { CodeSnippet } from '../models/code-snippet.model';
import { CodeSnippetService } from '../services/code-snippets.service';
import { User } from '../../users/models/user';
import { ObjectId } from 'bson';
import { CodeSnippetsGeneratorService } from '../services/code-snippets-generator.service';

@Controller('code-snippets')
@SetMetadata('entityModel', CodeSnippet)
export class CodeSnippetController extends BaseController<CodeSnippet> {

  constructor(protected service: CodeSnippetService, 
    protected codeSnippetsGeneratorService: CodeSnippetsGeneratorService,
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
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log("@Post Code Snippets", body);

    try {
        const requestingUser: User = this.utilitiesService?.getUser(request);
        if (!requestingUser) {
            return response.status(401).json({ message: 'Unauthorized' });
        }

        const codeSnippet: CodeSnippet = {
            ...body,
            userId: new ObjectId(requestingUser._id),
            createdBy: new ObjectId(requestingUser._id),
            createdDate: new Date()
        };

        const createdcodeSnippet = await this.service.createAsync(codeSnippet);
        console.log('createdcodeSnippet', createdcodeSnippet);
        return response.status(200).json(createdcodeSnippet);
    } catch (error) {
        console.error('Error creating code snippet:', error);
        return response.status(500).json(error);
    }
  }

  @Post('generate-snippet')
  async generateSnippet(
    @Body() body: { description: string; language: string },
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log("@Post Code Snippets Generator", body);
    try {
        const requestingUser: User = this.utilitiesService?.getUser(request);
        if (!requestingUser) {
            return response.status(401).json({ message: 'Unauthorized' });
        }

        const createdcodeSnippet = await this.codeSnippetsGeneratorService.generateCodeSnippetWithAI(
          body.description,
          body.language
        );

        console.log('createdcodeSnippet', createdcodeSnippet);
        return response.status(200).json(createdcodeSnippet);
    } catch (error) {
        console.error('Error creating code snippet:', error);
        return response.status(500).json(error);
    }
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