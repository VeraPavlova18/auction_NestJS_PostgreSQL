import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import supertest = require('supertest');
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { typeOrmTestConfig } from './typeorm-test-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { mailerModuleConfig } from '../../src/config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { AuthModule } from '../../src/auth/auth.module';
import { LotsModule } from '../../src/lots/lots.module';
import { BidsModule } from '../../src/bids/bids.module';
import { OrdersModule } from '../../src/orders/orders.module';
import { UserRepository } from '../../src/auth/user.repository';
import { LotRepository } from '../../src/lots/lot.repository';
import { BidRepository } from '../../src/bids/bid.repository';
import { OrderRepository } from '../../src/orders/order.repository';
import { LotsProcessor } from '../../src/lots/lots.processor';

let app: INestApplication;
let client;
let authRepository;
let lotRepository;
let bidRepository;
let orderRepository;
let lotsProcessor;

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
    authRepository = module.get<UserRepository>(UserRepository);
    lotRepository = module.get<LotRepository>(LotRepository);
    bidRepository = module.get<BidRepository>(BidRepository);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    lotsProcessor = module.get<LotsProcessor>(LotsProcessor);
    await app.init();
    client = supertest.agent(app.getHttpServer());
  }

  return { app, client, authRepository, lotRepository, bidRepository, orderRepository, lotsProcessor };
}
