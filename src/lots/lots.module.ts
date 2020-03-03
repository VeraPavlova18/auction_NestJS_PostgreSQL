import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from 'src/logger/my-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([LotRepository]), AuthModule],
  controllers: [LotsController],
  providers: [LotsService, SendEmailService, DBqueries, MyLogger],
})
export class LotsModule {}
