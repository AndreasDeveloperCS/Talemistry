import { Strategy, ExtractJwt } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { config } from '../../config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {

    console.log('Refresh Jwt Strategy JwtStrategy');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config?.jwtSecret || process.env.SECRET,
    });

    console.log('Refresh Jwt Strategy JwtStrategy');
  }

  async validate(payload: any) {
    return { ...payload.user }
  }

}
