import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppGateway } from '../app.gateway';
import { AuthModule } from '../auth/auth.module';
import { BidRepository } from './bid.repository';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { SendEmailService } from '../mail/sendEmailService';

@Module({
  imports: [TypeOrmModule.forFeature([BidRepository]), AuthModule],
  controllers: [BidsController],
  providers: [BidsService, AppGateway, SendEmailService],
})
export class BidsModule {}
