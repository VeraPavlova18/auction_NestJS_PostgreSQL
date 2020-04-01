import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppGateway } from '../app.gateway';
import { AuthModule } from '../auth/auth.module';
import { BidRepository } from './bid.repository';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { BidsProcessor } from './bids.processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([BidRepository]),
    BullModule.registerQueue({
      name: 'bids',
      redis: {
        host: process.env.host,
        port: 6379,
      },
    }),
    AuthModule],
  controllers: [BidsController],
  providers: [
    BidsService,
    AppGateway,
    SendEmailService,
    DBqueries,
    MyLogger,
    BidsProcessor],
})
export class BidsModule {}
