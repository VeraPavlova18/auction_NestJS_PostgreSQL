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

  const user1: AuthCredentialsDto = {
    firstName: 'Test user1',
    lastName: 'Pavlova1',
    email: 'test@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  };

  const user2: AuthCredentialsDto = {
    firstName: 'Test user2',
    lastName: 'Pavlova2',
    email: 'test2@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  };

  const user3: AuthCredentialsDto = {
    firstName: 'Test user3',
    lastName: 'Pavlova3',
    email: 'test2@test.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  };

  const user4: AuthCredentialsDto = {
    firstName: 'Test user4',
    lastName: 'Pavlova4',
    email: 'test4@test.com',
    phone: '123',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  };

  const user5: AuthCredentialsDto = {
    firstName: 'Test user5',
    lastName: 'Pavlova4',
    email: 'test5',
    phone: '12345',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  };

  const user6: AuthCredentialsDto = {
    firstName: 'Test user6',
    lastName: 'Pavlova6',
    email: 'test6@email.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('2006-12-19').toDate(),
  };

  describe('POST /auth/signup', () => {
    it('should create a user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user1)
        .expect(201);
    });

    it('should not create a user with duplicate email', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user1)
        .expect(409)
        .expect(({ body }) => {
          expect(body.message).toEqual(`Key (email)=(${user1.email}) already exists.`);
        });
    });

    it('should not create a user with duplicate phone', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user2)
        .expect(409)
        .expect(({ body }) => {
          expect(body.message).toEqual(`Key (phone)=(${user2.phone}) already exists.`);
        });
    });

    it('should not create a user with phone that is not phone', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user4)
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.matches).toEqual(`Invalid phone number`);
        });
    });

    it('should not create a user with email that is not email', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user5)
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isEmail).toEqual('email must be an email');
        });
    });

    it('should not create a user whose age is < 21', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/auth/signup')
        .send(user6)
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
        .send({ email: user1.email, password: user1.password })
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
