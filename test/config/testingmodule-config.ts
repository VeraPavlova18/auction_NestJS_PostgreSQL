import * as dotenv from 'dotenv';
dotenv.config();

import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { AppModule } from '../../src/app.module';
import { AuthModule } from '../../src/auth/auth.module';
import { BidsModule } from '../../src/bids/bids.module';
import { LotsModule } from '../../src/lots/lots.module';
import { OrdersModule } from '../../src/orders/orders.module';
import * as path from 'path';
import { mailerModuleConfig } from '../../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { SendEmailService } from '../../src/mail/sendEmailService';
import { UserRepository } from '../../src/auth/user.repository';
import { JwtStrategy } from '../../src/auth/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';
import { typeOrmTestConfig } from './typeorm-test-config';

let app;
let auth;
let repository;

export async function createTestingAppModule() {
  if (!app) {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(typeOrmTestConfig),
        ServeStaticModule.forRoot({
          rootPath: path.join(__dirname, '..', 'static'),
        }),
        ScheduleModule.forRoot(),
        AppModule,
        AuthModule,
        LotsModule,
        BidsModule,
        OrdersModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  }

  return app;
}

export async function createTestingAuthModule() {
  if (!auth) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendEmailService, AuthService, JwtStrategy],
      imports: [
        TypeOrmModule.forRoot(typeOrmTestConfig),
        TypeOrmModule.forFeature([UserRepository]),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: {
            expiresIn: +process.env.JWT_EXPIN,
          },
        }),
        MailerModule.forRootAsync(mailerModuleConfig),
        AuthModule,
      ],
    }).compile();

    auth = module.createNestApplication();
    repository = module.get('UserRepository');
    await auth.init();
  }

  return { auth, repository };
}
