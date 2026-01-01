import * as nodemailer from 'nodemailer';

export const mailConfig = {
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
};

export default mailConfig;
