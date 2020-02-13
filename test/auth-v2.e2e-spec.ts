import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication, Res } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as supertest from 'supertest';
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
      providers: [SendEmailService, AuthService, JwtStrategy],
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

  afterAll(async () => {
    await repository.query(`DELETE FROM "user";`);
    await app.close();
  });

  const user: AuthCredentialsDto = {
    firstName: 'Test user',
    lastName: 'Pavlova',
    email: 'pavlova.vera18@gmail.com',
    phone: '111111111111',
    password: 'Qwerty123',
    birthday: moment('1992-12-19').toDate(),
  };

  describe('POST /auth/signup', () => {
    it('should create a user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user)
        .expect(201);
    });
  });

  describe('POST /auth/signin', () => {
    it('should`nt return token', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signin')
        .send({ email: user.email, password: user.password })
        .expect(401);
    });

    // it('should return token', async () => {
    //   const client = supertest.agent(app.getHttpServer());

    //   await client
    //     .post('/auth/signin')
    //     .send({ email: user.email, password: user.password })
    //     .expect(200);
    // });
  });
});
