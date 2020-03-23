import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { AuthModule } from '../auth/auth.module';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { BullModule } from '@nestjs/bull';
import { LotsProcessor } from './lots.processor';
import { SendEmailService } from '../mail/sendEmailService';
import { PaymentService } from 'src/payment/paymentService';

@Module({
  imports: [
    TypeOrmModule.forFeature([LotRepository]),
    BullModule.registerQueue({
      name: 'lots',
      redis: {
        host: process.env.host,
        port: 6379,
      },
    }),
    AuthModule,
  ],
  controllers: [LotsController],
  providers: [LotsService, SendEmailService, PaymentService, DBqueries, MyLogger, LotsProcessor],
})
export class LotsModule {}
