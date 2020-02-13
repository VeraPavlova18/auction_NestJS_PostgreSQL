import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication, Res } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';
import { User } from '../src/auth/user.entity';
import { AuthModule } from '../src/auth/auth.module';
import { AuthCredentialsDto } from '../src/auth/dto/auth-credentials.dto';
import * as moment from 'moment';
import { SendEmailService } from '../src/mail/sendEmailService';
import { mailerModuleConfig } from '../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { UserRepository } from '../src/auth/user.repository';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

describe('User', () => {
  let app: INestApplication;
  let repository: UserRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SendEmailService,
        AuthService,
        JwtStrategy,
      ],
      imports: [
        AuthModule,
        MailerModule.forRootAsync(mailerModuleConfig),
        TypeOrmModule.forRoot({
          type: process.env.TYPE as any,
          host: process.env.DB_HOST,
          port: +process.env.DB_PORT,
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: 'auction_test',
          entities: [__dirname + '/../**/*.entity.{js,ts}'],
          synchronize: Boolean(process.env.TYPEORM_SYNC),
        }),
        TypeOrmModule.forFeature([UserRepository]),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: {
            expiresIn: +process.env.JWT_EXPIN,
          },
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    repository = module.get('UserRepository');
    await app.init();
  });

  afterEach(async () => {
    await repository.query(`DELETE FROM "user";`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {

    const user: AuthCredentialsDto = {
      firstName: 'Test user',
      lastName: 'Pavlova',
      email: 'pavlova.vera18@gmail.com',
      phone: '111111111111',
      password: 'Qwerty123',
      birthday: moment('1992-12-19').toDate(),
    };

    it('should create a user in the DB', async () => {
      await supertest
        .agent(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201);
    });
  });
});
