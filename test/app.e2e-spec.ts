import * as dotenv from 'dotenv';
dotenv.config();
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { mailerModuleConfig } from '../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { BidsModule } from '../src/bids/bids.module';
import { AuthModule } from '../src/auth/auth.module';
import { LotsModule } from '../src/lots/lots.module';
import { OrdersModule } from '../src/orders/orders.module';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
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
        ServeStaticModule.forRoot({
          rootPath: path.join(__dirname, '..', 'static'),
        }),
        MailerModule.forRootAsync(mailerModuleConfig),
        ScheduleModule.forRoot(),
        AuthModule,
        LotsModule,
        BidsModule,
        OrdersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });
});
