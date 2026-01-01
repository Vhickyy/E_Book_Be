import { Inject, Injectable } from '@nestjs/common';
import { ConfigService, getConfigToken, type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { JwtPayload } from '../types/jwt_payload';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
  // constructor(
  //   @Inject(jwtConfig.KEY)
  //   private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  // ) {
  //   super({
  //     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  //     ignoreExpiration: false,
  //     secretOrKey: jwtConfiguration.secret!,
  //   });
  // }

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub };
  }
}
