import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { BullModule } from '@nestjs/bull';
import { LotsProcessor } from './lots.processor';

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
  providers: [LotsService, SendEmailService, DBqueries, MyLogger, LotsProcessor],
})
export class LotsModule {}
