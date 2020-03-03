import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from '../mail/sendEmailService';
import { OrderRepository } from './order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBqueries } from 'src/db.queries';
import { MyLogger } from 'src/logger/my-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderRepository]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, SendEmailService, DBqueries, MyLogger],
})
export class OrdersModule {}
