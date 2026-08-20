import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  SetMetadata
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RecruitmentPlatformService } from '../services/recruitment-platform.service';
const multer = require('multer');

import { BaseController } from '../../base/controllers/base.controller';
import { UtilitiesService } from '../../core/services/utilities.service';
import { RecruitmentPlatform } from '../models/recruitment-platform';
import { LinkedInAdapterService } from '../services/linked-in-adapter.service';
import { ModuleRef } from '@nestjs/core';

@Controller('session-tokens')
@SetMetadata('entityModel', RecruitmentPlatform)
export class SessionTokenController extends BaseController<RecruitmentPlatform> {

  constructor(protected service: RecruitmentPlatformService,
    protected moduleRef: ModuleRef,
    private linkedInAdapterService: LinkedInAdapterService) {
    super(service, moduleRef);
  }

  @Post('linkedin')
  async getLinkedInUserData(
    @Body() body: { userId: any, code: any },
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    try {
      console.log('SessionTokenController Recruitment LinkedIn Id Token', body);

      const user = this.utilitiesService.getUser(request);
      const token = await this.linkedInAdapterService.getAccessToken(body);

      console.log('SessionTokenController Recruitment LinkedIn Id Token', user, token?.id_token);
      const linkedInUser = await this.linkedInAdapterService.decodeIdToken(token.id_token);
      console.log('LinkedIn user', linkedInUser);
      const sessionToken = await this.linkedInAdapterService.createSessionToken(token, linkedInUser, user._id);
      return response.status(200).json(sessionToken);
    } catch (error) {
      console.error(error);
      return response.status(error?.status).json({ message: error?.message });
    }
  }
}