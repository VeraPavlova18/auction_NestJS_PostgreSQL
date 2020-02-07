import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';

@Injectable()
export class SendEmailService {
  constructor(private readonly mailerService: MailerService) {}

  public sendConfirmEmail(email, name, link = '#'): void {
    this.mailerService.sendMail({
      to: email,
      from: 'mailer.test000111@gmail.com',
      subject: 'Confirm your email address',
      text: `${name} in order to complete the sign-up process, please click the confirmation link: ${link}.`,
    });
  }

  public sendRecoveryEmail(email, name, link = '#'): void {
    this.mailerService.sendMail({
      to: email,
      from: 'mailer.test000111@gmail.com',
      subject: 'Change your password',
      text: `${name} in order to complete the change passwort process, please click the link: ${link}.`,
    });
  }

  public sendEmailToTheBidsWinner(email, name, lotTitle, price, link = '#'): void {
    this.mailerService.sendMail({
      to: email,
      from: 'mailer.test000111@gmail.com',
      subject: `You are a winner of bids for ${lotTitle}`,
      text: `${name}, you are a winner of bids for ${lotTitle} with current price of ${price}. You can create a order by follow this link: ${link}`,
    });
  }

  public sendEmailToTheLotOwner(email, name, lotTitle, price, link = '#'): void {
    this.mailerService.sendMail({
      to: email,
      from: 'mailer.test000111@gmail.com',
      subject: `The lot ${lotTitle} is closed`,
      text: `${name}, your lot ${lotTitle} is closed with current price of ${price}. You can find the details by follow this link: ${link}`,
    });
  }
}
