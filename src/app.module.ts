import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LotsModule } from './lots/lots.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm-config';
import { BidsModule } from './bids/bids.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nest-modules/mailer';
import { mailerModuleConfig } from './config/mailer-module-config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    MailerModule.forRootAsync(mailerModuleConfig),
    ScheduleModule.forRoot(),
    AuthModule,
    LotsModule,
    BidsModule,
    OrdersModule,
  ],
})
export class AppModule {}
