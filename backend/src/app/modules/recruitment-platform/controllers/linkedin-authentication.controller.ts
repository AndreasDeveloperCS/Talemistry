import {
  Controller,
  Get,
  Req,
  Res,
  SetMetadata
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseController } from '../../base/controllers/base.controller';
import { RecruitmentPlatform } from '../models/recruitment-platform';
import { RecruitmentPlatformService } from '../services/recruitment-platform.service';
import { ModuleRef } from '@nestjs/core';

@Controller('auth/linkedin/callback')
@SetMetadata('entityModel', RecruitmentPlatform)
export class LinkedInAuthenticationController extends BaseController<RecruitmentPlatform> {
  constructor(protected service: RecruitmentPlatformService,
    protected moduleRef: ModuleRef,
  ) {
    super(service, moduleRef);
  }

  @Get()
  async getLinkedinCode(
    // @Query('code') code: string,
    // @Param('code') code: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log("LinkedInAuthenticationController REQUEST", request);
      //console.log("LinkedInAuthenticationController Code", code);
      const id: string = request as any as string;
      const result = await this.service.getByIdAsync(id);
      response.status(200).json(result);
    } catch (error) {
      return response.status(200).send(error);
    }
  }
}