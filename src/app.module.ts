import { Module } from '@nestjs/common';
import { LotsModule } from './lots/lots.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm-config';
import { BidsModule } from './bids/bids.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    LotsModule,
    BidsModule,
    OrdersModule,
  ],
})
export class AppModule {}
