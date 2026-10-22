
import {
  Body,
  Controller,
  Get,
  HttpCode, HttpStatus,
  Inject,
  Param, Patch,
  Post,
  Query,
  Req, Res,
  SetMetadata,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { baseUrl } from '../../../config';
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
import { GoogleUserDocument, SocialUser } from '../models/social-user';
import { UserSession } from '../models/session';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService, GoogleProfile } from '../services/google-auth.service';
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
    @InjectModel(SocialUser.name)
    private socialUserModel: Model<GoogleUserDocument>,
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

      } catch (ex: any) {
        // E11000 = another process already seeded the superadmin; not an error.
        const code = ex?.code ?? ex?.errorResponse?.code;
        if (code === 11000 || String(ex?.message).includes('E11000')) {
          console.log('Superadmin user already exists — seed skipped.');
        } else {
          console.error(ex);
        }
      }

    })();
  }

  /**
   * "Sign in with Google" button flow (Google Identity Services): the
   * frontend posts the signature-verified credential ID token it received
   * directly from Google. Logs in an existing user or auto-registers
   * ("signs up") a new one on first use.
   */
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(
    @Body('token') idToken: string,
    @Body('role') role: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    try {
      const profile = await this.googleAuthService.verifyIdToken(idToken);
      if (!profile.emailVerified) {
        return response.status(HttpStatus.UNAUTHORIZED).json({ message: 'Google account email is not verified.' });
      }

      const user = await this.findOrCreateUserFromGoogle(profile, role);
      const sessionToken = await this.issueSessionTokens(user);

      return response.status(HttpStatus.OK).json({ userData: sessionToken });
    } catch (error) {
      console.error('googleLogin', error);
      return response.status(error?.status || HttpStatus.UNAUTHORIZED).json({ message: error?.message || 'Google sign-in failed' });
    }
  }

  /**
   * Starts the server-side OAuth2 authorization-code flow: redirects the
   * browser to Google's consent screen. This is the flow tied to the
   * "Authorized redirect URI" (GET google/callback below) configured in the
   * Google Cloud Console OAuth client.
   */
  @Get('google')
  async googleAuthorize(
    @Query('returnUrl') returnUrl: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    const state = this.googleAuthService.createState({ returnUrl });
    const redirectUri = this.googleAuthService.resolveRedirectUri(request);
    const url = this.googleAuthService.getAuthorizationUrl(state, redirectUri);
    return response.redirect(url);
  }

  /**
   * Google redirects here with `code`/`state` after the user grants consent.
   * On success/failure the browser is redirected back to the frontend login
   * page, carrying either the issued session tokens or an error flag.
   */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    const loginUrl = new URL('auth/login', `${baseUrl.replace(/\/$/, '')}/`);
    try {
      if (error || !code) {
        throw new UnauthorizedException(error || 'Google sign-in was cancelled.');
      }

      const { returnUrl } = this.googleAuthService.verifyState(state);
      const redirectUri = this.googleAuthService.resolveRedirectUri(request);
      const tokens = await this.googleAuthService.exchangeCode(code, redirectUri);
      const profile = await this.googleAuthService.verifyIdToken(tokens.id_token);

      if (!profile.emailVerified) {
        throw new UnauthorizedException('Google account email is not verified.');
      }

      const user = await this.findOrCreateUserFromGoogle(profile);
      const sessionToken = await this.issueSessionTokens(user);

      loginUrl.searchParams.set('googleToken', sessionToken.token);
      loginUrl.searchParams.set('googleRefreshToken', sessionToken.refreshToken);
      loginUrl.searchParams.set('googleUserId', String(sessionToken.id));
      if (returnUrl) {
        loginUrl.searchParams.set('returnUrl', returnUrl);
      }
      return response.redirect(loginUrl.toString());
    } catch (ex) {
      console.error('googleCallback', ex);
      loginUrl.searchParams.set('error', 'google_auth_failed');
      return response.redirect(loginUrl.toString());
    }
  }

  /** Find the user matching a verified Google profile, or auto-register ("sign up") a new one. */
  private async findOrCreateUserFromGoogle(profile: GoogleProfile, requestedRole?: string) {
    await this.socialUserModel.updateOne(
      { googleId: profile.googleId },
      {
        $set: {
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          modifiedDate: new Date(),
        },
        $setOnInsert: { createdDate: new Date() },
      },
      { upsert: true },
    ).exec();

    let user = await this.userService.findByEmail(profile.email);
    if (!user) {
      const nameParts = (profile.name || profile.email.split('@')[0]).trim().split(/\s+/);
      const role = Object.values(ROLES).includes(requestedRole as ROLES) ? [requestedRole as ROLES] : [ROLES.TALENT];

      await this.userService.registerUser({
        firstname: profile.givenName || nameParts[0] || 'Talemistry',
        lastname: profile.familyName || nameParts.slice(1).join(' ') || 'Member',
        email: profile.email,
        phone: '',
        role,
        isSocialUser: true,
      } as UserDto);

      await this.userService.markSocialProfile(profile.email, {
        isVerifiedEmail: profile.emailVerified,
        photo: profile.picture,
      });

      user = await this.userService.findByEmail(profile.email);
    }

    return user;
  }

  /** Issue JWT access/refresh tokens for a user and persist the session, mirroring the password-login flow. */
  private async issueSessionTokens(user: any) {
    const userModel = this.userService.getUser(user);
    const token = await this.jwtService.signAsync({ user: userModel }, {});
    const refreshToken = await this.jwtService.signAsync({ user: userModel }, this.refreshTokenConfig);
    this.userSessionService.saveSession(user._id, user.email, token, refreshToken);
    return { id: user._id, token, refreshToken };
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
