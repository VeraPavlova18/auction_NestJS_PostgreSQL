import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from 'src/auth/auth.module';
import { SendEmailService } from 'src/mail/sendEmailService';
import { OrderRepository } from './order.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OrderRepository]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, SendEmailService],
})
export class OrdersModule {}
