import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export const MailProvider = {
  provide: 'MAIL',
  useFactory: async () => {
    const testAccount = await nodemailer.createTestAccount();

    return {
      transport: {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      },
    };
  },
  inject: [ConfigService],
};
