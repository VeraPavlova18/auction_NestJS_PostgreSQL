import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';

@Injectable()
export class SendEmailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendConfirmEmail(email, name, link= '#'): void {
    this
      .mailerService
      .sendMail({
        to: email,
        from: 'mailer.test000111@gmail.com',
        subject: 'Confirm your email address',
        text: `${name} in order to complete the sign-up process, please click the confirmation link: ${link}.`,
      });
  }
}
