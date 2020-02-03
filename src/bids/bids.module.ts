import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidRepository } from './bid.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([BidRepository]), AuthModule],
  providers: [BidsService],
  controllers: [BidsController],
})
export class BidsModule {}
