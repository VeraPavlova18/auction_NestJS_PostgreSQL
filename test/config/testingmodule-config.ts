import * as dotenv from 'dotenv';
dotenv.config();

import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from '../../src/auth/auth.module';
import { LotsModule } from '../../src/lots/lots.module';
import { OrdersModule } from '../../src/orders/orders.module';
import * as path from 'path';
import { mailerModuleConfig } from '../../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { UserRepository } from '../../src/auth/user.repository';
import { typeOrmTestConfig } from './typeorm-test-config';
import { BidsModule } from '../../src/bids/bids.module';
import { LotRepository } from '../../src/lots/lot.repository';
import { BidRepository } from '../../src/bids/bid.repository';

let app;
let authRepository;
let lotRepository;
let bidRepository;

export async function createTestingAppModule() {
  if (!app) {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(typeOrmTestConfig),
        ServeStaticModule.forRoot({
          rootPath: path.join(__dirname, '..', 'static'),
        }),
        MailerModule.forRootAsync(mailerModuleConfig),
        AuthModule,
        LotsModule,
        BidsModule,
        OrdersModule,
      ],
    }).compile();

    app = module.createNestApplication();
    authRepository = await module.get<UserRepository>(UserRepository);
    lotRepository = await module.get<LotRepository>(LotRepository);
    bidRepository = await module.get<BidRepository>(BidRepository);
    await app.init();
  }

  return { app, authRepository, lotRepository, bidRepository };
}
