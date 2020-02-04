import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppGateway } from 'src/app.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { BidRepository } from './bid.repository';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BidRepository]), AuthModule],
  controllers: [BidsController],
  providers: [BidsService, AppGateway],
})
export class BidsModule {}
