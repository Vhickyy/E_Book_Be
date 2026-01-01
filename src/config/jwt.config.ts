// import { ConfigService, registerAs } from '@nestjs/config';
// import { JwtModuleOptions } from '@nestjs/jwt';

// const jwtConfig = (): JwtModuleOptions => {
//   // secret: process.env.JWT_SECRET,
//   // signOptions: {
//   //   expiresIn: process.env.JWT_EXPIRES_IN,
//   // },
//   import:[ConfigService],
//   inject: [ConfigService],
//       useFactory: (config: ConfigService) => ({
//         secret: config.get<string>('jwt.secret'),
//         signOptions: {
//           expiresIn: config.get<string>('jwt.signOptions.expiresIn'),
//         },
//       }),
// };

// export default registerAs('jwt', jwtConfig);

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
    },
  }),
};

export default jwtConfig;
