import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { UserRepository } from '../src/auth/user.repository';
import { SendEmailService } from '../src/mail/sendEmailService';
import { mailerModuleConfig } from '../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { users } from './constants';
import * as moment from 'moment';

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

  describe('POST /auth/signup', () => {
    it('should create a user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[0])
        .expect(201);
    });

    it('should not create a user with duplicate email', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[0])
        .expect(409)
        .expect(({ body }) => {
          expect(body.message).toEqual(`Key (email)=(${users[0].email}) already exists.`);
        });
    });

    it('should not create a user with duplicate phone', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[1])
        .expect(409)
        .expect(({ body }) => {
          expect(body.message).toEqual(`Key (phone)=(${users[1].phone}) already exists.`);
        });
    });

    it('should not create a user with phone that is not phone', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[3])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.matches).toEqual(`Invalid phone number`);
        });
    });

    it('should not create a user with email that is not email', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[4])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isEmail).toEqual('email must be an email');
        });
    });

    it('should not create a user whose age is < 21', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(users[5])
        .expect(400)
        .expect(({ body }) => {
          expect(`body.message[0].constraints.maxDate).toEqual('maximal allowed date for birthday is ${moment()
            .subtract(21, 'years')
            .toDate()}`);
        });
    });
  });

  describe('POST /auth/signin', () => {
    it('should not return token if user not confirmed', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signin')
        .send({ email: users[0].email, password: users[0].password })
        .expect(401);
    });

    it('should not return token if user not exist', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signin')
        .send({ email: 'test', password: 'test' })
        .expect(400);
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
