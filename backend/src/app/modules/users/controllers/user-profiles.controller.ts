import { Body, ConflictException, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../models/user';
import { UsersService } from '../services/user.service';
import { MessageNotificationPreferences } from '../../communication/enums/communication-means.enum';
import { ObjectId } from 'bson';

@Controller('user-profiles')
@SetMetadata('entityModel', User)
export class UserProfilesController extends BaseController<User> {

  constructor(private userService: UsersService,
    protected moduleRef: ModuleRef,
  ) {
    super(userService, moduleRef)
  }

  @Get('message-preferences/:id')
  @HttpCode(HttpStatus.OK)
  async getMessagePreferencesById(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    console.log("@Get('message-preferences/:id')", id);
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const result: MessageNotificationPreferences = await this.userService.getMessagePreferencesById(id);
      console.log('Message Notification Preferences result', result);
      return response.status(200).json(result);
    } catch (error) {
      console.error('getMessagePreferencesById error:', error);
      return response.status(500).json({ message: 'Internal server error', error });
    }
  }

  @Get('me/telegram-status')
  async getTelegramStatus(
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const user: User = this.utilitiesService.getUser(request);
      const status = {
        linked: !!user.telegram?.chatId,
        enabled: user.telegram?.enabled ?? false,
        chatId: user.telegram?.chatId,
        username: user.telegram?.username
      };
      return response.status(200).json(status);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  @Get('direct-chat-contact')
  @HttpCode(HttpStatus.OK)
  async getDirectChatContact(
    @Query('identifier') identifier: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const requestingUser: User = this.utilitiesService.getUser(request);
      const result = await this.userService.findDirectChatContact(identifier, requestingUser?._id);

      if (!result) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: 'No user found for this username or alias, email, or phone number.',
        });
      }

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Direct chat contact lookup error:', error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
        error,
      });
    }
  }

  @Post('telegram/connect-token')
  @HttpCode(HttpStatus.CREATED)
  async generateTelegramConnectToken(
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip: string,
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const user = this.utilitiesService.getUser(request);
      if (!user?._id) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      const result = await this.userService.generateTelegramConnectToken(user._id);
      console.log('Generate Telegram token result', result);
      return response.status(HttpStatus.CREATED).json(result);
    } catch (ex) {
      console.error('Generate Telegram token error', ex.message);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ex.message,
      });
    }
  }

  @Post('telegram/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetTelegram(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const user = this.utilitiesService.getUser(request);
      if (!user?._id) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Unauthorized',
        });
      }

      await this.userService.resetTelegramState(user._id);

      return response.status(HttpStatus.NO_CONTENT).send();
    } catch (ex) {
      console.error('Reset Telegram error', ex.message);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ex.message,
      });
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getById(
    @Param('id') id: any,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const requestingUser: User = this.utilitiesService.getUser(request);

      // TODO: Check if the user has admin permissions or has the right role or add filter that user should have access only to profile that belong to him

      //const isAdmin = requestingUser.role.some(role => role.toUpperCase() == ROLES.SA.toUpperCase() || role.toUpperCase() == ROLES.ADMIN.toUpperCase());
      console.log('requesting User', requestingUser._id);
      console.log('id', id);
      console.log('id != requestingUser._id', id != requestingUser._id);

      if (id != requestingUser._id) {
        return response.status(403).json({ message: `User is not authorized to request or change this data` });
      }

      const requestedUser = await this.userService.findById(id);
      // console.log(requestingUser, requestedUser);

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
    console.log('Put User Profile', id, body);

    try {
      const requestingUser: User = await this.utilitiesService.getUser(request);
      console.log('PUT user-profile update requestingUser', requestingUser);
      const entity: User = request.body;
      entity.username = this.userService.normalizeUsername(entity.username);
      await this.userService.ensureUsernameAvailable(entity.username, entity._id);
      console.log('entity', entity);
      const isAdmin = requestingUser.role.some(role => role.toUpperCase() == "SA" || role.toUpperCase() == "ADMIN");

      let exisitingEntity: User = await this.utilitiesService.getUser(request);

      console.log('PUT user-profile update exisitingEntity', exisitingEntity);
      const userId = new ObjectId(entity._id);

      if (exisitingEntity?._id && (requestingUser?._id == userId || isAdmin)) {
        console.log('PUT user-profile update', entity, exisitingEntity);
        const paginationResult = await this.service.updateAsync(entity);
        console.log(entity, paginationResult);
        return response.status(204).json(paginationResult);
      }
      console.log('requestingUser._id', requestingUser._id, 'userdId', userId, requestingUser._id != userId);
      if (requestingUser._id != userId && !isAdmin) {
        return response.status(403).json({ message: `User is not authorized to request or change this data` });
      }
    } catch (error) {
      if (error instanceof ConflictException || error?.code === 11000) {
        return response.status(HttpStatus.CONFLICT).json({
          message: 'This username is already taken.',
        });
      }

      console.error(error);
      return response.status(500).send(error);
    }
  }
}
