import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppGateway } from 'src/app.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { BidRepository } from './bid.repository';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { SendEmailService } from 'src/mail/sendEmailService';

@Module({
  imports: [TypeOrmModule.forFeature([BidRepository]), AuthModule, SendEmailService],
  controllers: [BidsController],
  providers: [BidsService, AppGateway, SendEmailService],
})
export class BidsModule {}
