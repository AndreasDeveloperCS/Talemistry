import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
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
import { Request, Response } from 'express';
import { IVerificationData, IVerificationRequest } from '../interfaces/user.interface';
import { UsersService } from '../services/user.service';
import { VerificationService } from '../services/verification.service';

import { ObjectId } from 'bson';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { UserDto } from '../models/auth.dto';
import { User } from '../models/user';
import { ModuleRef } from '@nestjs/core';

@Controller('users')
@SetMetadata('entityModel', User)
export class UserController extends BaseController<User> {

  constructor(private userService: UsersService,
    private verificationService: VerificationService,
    protected moduleRef: ModuleRef) {
    super(userService, moduleRef)
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async get(
    @PaginationParams() paginationParams: Pagination,
    @Query('sortParams') sortParams: string,
    @Query('filterParams') filterParams: string,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async post(
    @Body() userDto: UserDto,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<IVerificationRequest | any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('Register user', userDto);
    try {
      const userId = this.utilitiesService.getUser(request)?._id || null;
      console.log('User ID from request', userId);
      const result = await this.userService.registerUser(userDto, userId);
      console.log('Auth Controller register result', result);
      return await response.status(200).json(result);
    } catch (ex) {
      console.log('Auth Controller register error', ex.message);
      return response.status(500).json(ex);
    }
  }

  @HttpCode(204)
  @Patch('/:userId/email-verification/:requestId')
  async verifyEmail(@Param('userId') userId: string,
    @Param('requestId') requestId: string,
    @Body() verificationData: IVerificationData) {

    await this.verificationService.verify(verificationData);
    return await this.userService.verifyEmail(verificationData);
  }

  @Patch(':_id')
  async patch(
    @Param('_id') _id: string,
    @Query('propertyName') propertyName: string,
    @Body() body: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      // console.log(_id, propertyName, body);
      const keyValue = JSON.parse(JSON.stringify(body));
      const property = Object.keys(keyValue)[0];
      const value = Object.values(keyValue)[0];
      // console.log(Object.keys(keyValue)[0], Object.values(keyValue)[0]);
      const id = new ObjectId(_id);
      const result = await this.userService.patchAsync(_id, property, value);

      return response.status(200).send(result);
    } catch (error) {
      console.error(`Could not patch ${propertyName}: ${error}`);
      console.error(error);
      return response.status(500).send(error);
    }
  }

  @Put(':id')
  @HttpCode(204)
  async put(
    @Param('id') id: any,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip
  ): Promise<any> {
    console.log(`@Put(':id') ${id}`);
    const userId = this.utilitiesService.getUser(request)?._id;
    const newUser = request.body;
    newUser.modifiedBy = userId;
    console.log('Updating user with ID:', id, 'Data:', newUser);
    return await super.putAsync(body, request, response, ip);
  }

  @Delete(':_id')
  @HttpCode(204)
  async delete(
    @Param('_id') _id: any,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const requestingUser = this.utilitiesService.getUser(request);

      const deleteUserResult = await this.userService.deleteUserCascade(_id, requestingUser);
      console.log('Delete user res', deleteUserResult);

      return response.status(204).send(deleteUserResult);
    } catch (error) {
      return response.status(500).send(error);
    }
  }
}
