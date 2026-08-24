
import {
  Body,
  Controller,
  Get,
  HttpCode, HttpStatus,
  Inject,
  Param, Patch,
  Post,
  Req, Res,
  SetMetadata,
  UseGuards
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { LoginDto } from '../../../common/dto';
import { RefreshTokenDto } from '../../../common/dto/refresh-token.dto';
import { ROLES } from '../../../common/enums';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { BaseController } from '../../base/controllers/base.controller';
import { IVerificationData, IVerificationRequest } from '../../users/interfaces/user.interface';
import { UserDto } from '../../users/models/auth.dto';
import { UsersService } from '../../users/services/user.service';
import { VerificationService } from '../../users/services/verification.service';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { UserSession } from '../models/session';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { LinkedInAuthService } from '../services/linkedin-auth.service';
import { UserSessionService } from '../services/user-session.service';
import { ModuleRef } from '@nestjs/core';

@Controller('auth')
@SetMetadata('entityModel', UserSession)
export class AuthController extends BaseController<UserSession> {
  override className = this.constructor.name;
  constructor(
    private userSessionService: UserSessionService,
    private authService: AuthService,
    private userService: UsersService,
    private verificationService: VerificationService,
    protected moduleRef: ModuleRef,
    private readonly jwtService: JwtService,
    private googleAuthService: GoogleAuthService,
    private linkedInAuthService: LinkedInAuthService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>) {
    super(userSessionService, moduleRef);

    (async () => {
      try {
        const user: UserDto = {
          firstname: 'Super',
          lastname: 'Admin',
          phone: '+30 697 111 11 11',
          email: 'superadmin@talemistry.com',
          role: [ROLES.SA]
        }

        const existingUser = await this.userService.findByEmail(user.email);

        if (!existingUser) {
          await this.userService.registerUser(user);
        }

      } catch (ex) {
        console.error(ex);
      }

    })();
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(
    @Body('token') idToken: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    try {
      // TODO 
      // 1. Get Google User 
      // 2. Check if email is registered among users
      // 2.2 Save session with token to database sessions table
      // 3. If user exists return user from our database with appropriate token
      // 4. If user does not exists 

      // Scenario 1:
      // 5. Return user data to frontend
      // 6. Redirect to Registration with population of all fields based on returned data and ask user to define the tole (candidate or HR)
      // 7. Save new user.

      console.log('Google Id Token', idToken);
      const socialUser = await this.googleAuthService.decodeIdToken(idToken);
      console.log('Google user', socialUser);

      const existingUser = await this.userService.findByEmail(socialUser.email);

      if (existingUser) {

        const token = await this.jwtService.signAsync({ user: existingUser }, {});
        const refreshToken = await this.jwtService.signAsync({ user: existingUser }, this.refreshTokenConfig);
        this.userSessionService.saveSession(existingUser._id, socialUser.email, token, refreshToken);

        const sessionToken = {
          userData: {
            id: existingUser._id,
            token: token,
            refreshToken: refreshToken,
          }
        }
        console.log('Session token', sessionToken);
        return await response.status(200).json(sessionToken);
      }

      if (!existingUser) {
        const sessionToken = {
          userData: {
            id: undefined,
            token: await this.jwtService.signAsync({ user: existingUser }, {}),
            refreshToken: await this.jwtService.signAsync({ user: existingUser }, this.refreshTokenConfig),
          },
          socialUser,
        }
        console.log('Session token', sessionToken);
        return await response.status(200).json(sessionToken);
      }
    } catch (error) {
      console.error(error);
      return response.status(error.status).json(error);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('linkedin')
  async linkedInLogin(
    @Body('code') code: string,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    try {
      const token = await this.linkedInAuthService.getAccessToken(code);
      console.log('Auth LinkedIn Id Token', token?.id_token);

      const socialUser = await this.linkedInAuthService.decodeIdToken(token?.id_token);
      console.log('LinkedIn user', socialUser);

      const existingUser = await this.userService.findByEmail(socialUser.email);
      console.log(existingUser ? 'Existing user' : 'New user');

      if (existingUser) {

        const token = await this.jwtService.signAsync({ user: existingUser }, {});
        const refreshToken = await this.jwtService.signAsync({ user: existingUser }, this.refreshTokenConfig);
        this.userSessionService.saveSession(existingUser._id, socialUser.email, token, refreshToken);

        const sessionToken = {
          userData: {
            id: existingUser._id,
            token: token,
            refreshToken: refreshToken,
          },
        }
        console.log('Session token', sessionToken);
        return await response.status(200).json(sessionToken);
      }

      if (!existingUser) {
        const sessionToken = {
          userData: {
            id: undefined,
            token: await this.jwtService.signAsync({ user: existingUser }, {}),
            refreshToken: await this.jwtService.signAsync({ user: existingUser }, this.refreshTokenConfig),
          },
          socialUser,
        }
        console.log('Session token', sessionToken);
        return await response.status(200).json(sessionToken);
      }
    } catch (error) {
      console.error(error);
      return response.status(error?.status).json({ message: error?.message });
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(
    @Body() user: UserDto,
    @Req() request: Request,
    @Res() response: Response)
    : Promise<IVerificationRequest | any> {

    console.log('Register user', user);
    try {
      const userId = this.utilitiesService.getUser(request)?._id || null;
      console.log('User ID from request', userId);
      const result = await this.userService.registerUser(user, userId);
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
    @Body() verificationData: IVerificationData,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    console.log('Verify email', userId, requestId, verificationData);

    var verificationResult = await this.verificationService.verify(verificationData);
    var emailVerificationResult = await this.userService.verifyEmail(verificationData);

    return await response.status(200).json(verificationResult);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:userId/role')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  @UseGuards(RolesGuard)
  async getRole(
    @Param('userId') userId: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);

    try {
      const existingUser = await this.userService.findById(userId);
      const user = this.utilitiesService.getUser(request) ?? existingUser;

      const roles = [];
      user.role.forEach(role => roles.push(role.toUpperCase()));
      if (roles.length > 0) {
        return response.status(200).json(roles);
      }

      return response.status(403).json({
        error: user
      });

    } catch (ex) {
      return response.status(500).json(ex);
    }

  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() user: LoginDto,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log('login', user);

      const result = await this.authService.loginUser(user);
      console.log('login user', result);
      return response.status(HttpStatus.OK).json(result);
    } catch (ex) {
      return response.status(500).json(ex);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() tokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      console.log('Auth Controller refresh', tokenDto);

      const result = await this.authService.refreshToken(tokenDto);
      console.log('refresh toekn', result);
      return response.status(HttpStatus.OK).json(result);
    } catch (ex) {
      console.error('Auth Controller refresh', ex);
      return response.status(500).json(ex);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('recover')
  async recoverPassword(@Body() user: LoginDto,
    @Req() request: Request,
    @Res() response: Response): Promise<any> {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const result = await this.authService.recoverPassword(user.email);
      return response.status(HttpStatus.OK).json(result);
    } catch (ex) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(ex);
    }
  }
}
