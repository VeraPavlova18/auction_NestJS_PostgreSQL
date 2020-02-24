import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from '../mail/sendEmailService';
import { LotsQueries } from './lots.queries';
import { BidsQueries } from '../bids/bids.queries';

@Module({
  imports: [TypeOrmModule.forFeature([LotRepository]), AuthModule],
  controllers: [LotsController],
  providers: [LotsService, SendEmailService, LotsQueries, BidsQueries],
})
export class LotsModule {}
