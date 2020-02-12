import { Module } from '@nestjs/common';
import { typeOrmConfig } from './config/typeorm-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

import { ScheduleModule } from '@nestjs/schedule';
import { mailerModuleConfig } from './config/mailer-module-config';
import { MailerModule } from '@nest-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { LotsModule } from './lots/lots.module';
import { BidsModule } from './bids/bids.module';
import { OrdersModule } from './orders/orders.module';

import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
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
})
export class AppModule {}
