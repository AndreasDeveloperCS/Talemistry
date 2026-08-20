import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Put, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../models/user';
import { UsersService } from '../services/user.service';
import { ModuleRef } from '@nestjs/core';

@Controller('user-credentials')
@SetMetadata('entityModel', User)
export class UserCredentialsController extends BaseController<User> {

  constructor(private userService: UsersService,
    protected moduleRef: ModuleRef,
  ) {
    super(userService, moduleRef)
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log(`${this.className} GET`, id);
      if (!super.isAuthorized(request, response, id)) {
        return response.status(403).json({ message: `User is not authorized to request or change this data` });
      }

      const requestedUser = await this.userService.findById(id);

      return response.status(200).json(requestedUser);
    } catch (error) {
      return response.status(500).json(error);
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
    console.log(`${this.className} PUT`, id, body);

    try {
      if (!super.isAuthorized(request, response, id)) {
        return response.status(403).json({ message: `User is not authorized to request or change this data` });
      }
      const accessFilter = this.getAccessFilters(request);
      const requestedUser = await this.userService.getByIdAsync(id, accessFilter);

      const currentPasswordIsCorrect: boolean = await this.utilitiesService.passwordCheck(body.password, requestedUser.password);

      if (currentPasswordIsCorrect) {

        const result = await this.service.patchAsync(id, `password`, this.utilitiesService.hashPassword(body.newPassword));

        return response.status(200).send({
          succeed: true,
          message: `Great! The password has been changed successfully.`
        });
      } else {
        return response.status(403).send({
          succeed: false,
          message: `The current password is incorrect. The password has not been changed. Please check it.`
        });
      }

    } catch (error) {
      console.error(error);
      return response.status(500).send(error);
    }
  }
}
