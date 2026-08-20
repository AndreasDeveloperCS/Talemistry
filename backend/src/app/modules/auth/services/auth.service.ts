
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ConfigType } from '@nestjs/config';
import {
  ALREADY_REGISTER_ERROR,
  USER_NOT_FOUND_ERROR,
  WRONG_PASSWORD_ERROR,
} from '../../../common/constants';
import { LoginDto } from '../../../common/dto';
import { EmailService } from '../../email/services/email.service';
import { IVerificationRequest } from '../../users/interfaces/user.interface';
import { UsersService } from '../../users/services/user.service';
import { UtilitiesService } from '../../core/services/utilities.service';
import { VerificationService } from '../../users/services/verification.service';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { RefreshTokenDto } from '../../../common/dto/refresh-token.dto';

@Injectable()
export class AuthService {

  constructor(
    private utilitiesService: UtilitiesService,
    @Inject(forwardRef(() => UsersService))
    private readonly service: UsersService,
    private userVerificaiotnService: VerificationService,
    private emailService: EmailService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>
  ) {

  }

  async recoverPassword(email: string): Promise<IVerificationRequest> {
    const existingUser = await this.service.findByEmail(email);

    if (!existingUser) {
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }

    const verificaitonRequest = await this.userVerificaiotnService.createEmailVerificationRequest(
      existingUser
    );

    return verificaitonRequest;
  }

  async validateUser(email: string, password: any) {
    const user = await this.service.findByEmail(email);
    console.log('validateUser', user);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }
    const isPasswordMatch = await this.utilitiesService.passwordCheck(password, user.password);
    if (!isPasswordMatch) {
      throw new ForbiddenException(WRONG_PASSWORD_ERROR);
    }
    const userModel = this.service.getUser(user);
    console.log('userModel', userModel);
    return userModel;
  }

  async loginUser(dto: LoginDto) {
    const validUser = await this.validateUser(dto.email, dto.password);
    console.log('loginUser validUser', validUser);
    if (validUser == undefined) {
      return null;
    }

    const sessionToken = {
      id: validUser._id,
      token: await this.jwtService.signAsync({ user: validUser }, {}),
      refreshToken: await this.jwtService.signAsync({ user: validUser }, this.refreshTokenConfig),
    }
    console.log(sessionToken);

    return sessionToken;
  }

  async refreshToken(dto: RefreshTokenDto) {
    console.log('refreshToken method, dto', dto);
    const user = await this.service.findById(dto.id);
    console.log('refreshToken user', user);
    const refreshedSessionToken = {
      id: dto.id,
      accessToken: await this.jwtService.signAsync({ user: user }, {}),
      refreshToken: dto.refreshToken,
    }
    console.log(refreshedSessionToken);

    return refreshedSessionToken;
  }

}
