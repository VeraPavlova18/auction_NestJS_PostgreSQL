import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { AuthModule } from '../auth/auth.module';
import { SendEmailService } from 'src/mail/sendEmailService';

@Module({
  imports: [TypeOrmModule.forFeature([LotRepository]), AuthModule],
  controllers: [LotsController],
  providers: [LotsService, SendEmailService],
})
export class LotsModule {}
