import { MailerModule } from '@nest-modules/mailer';

export const mailerModuleConfig: MailerModule = {
  useFactory: () => ({
    transport: {
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_PASS,
      },
    },
    defaults: {
      from: '"nest-modules" <modules@nestjs.com>',
    },
  }),
};
