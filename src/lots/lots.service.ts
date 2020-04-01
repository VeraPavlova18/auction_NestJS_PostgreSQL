import { Injectable, NotFoundException, NotAcceptableException, InternalServerErrorException } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';
import { LotStatus } from './lot-status.enum';
import { DBqueries } from '../db.queries';
import { UpdateLotDto } from './dto/update-lot.dto copy';
import { MyLogger } from '../logger/my-logger.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import * as moment from 'moment';
import { PaymentService } from '../payment/paymentService';
import { SendEmailService } from 'src/mail/sendEmailService';

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotRepository) private lotRepository: LotRepository,
    @InjectQueue('lots') private readonly queue: Queue,
    private dbqueries: DBqueries,
    private paymentService: PaymentService,
    private readonly myLogger: MyLogger,
    private sendEmailService: SendEmailService,
  ) { this.myLogger.setContext('LotsService'); }

  async addLotJobs(lot: Lot): Promise<void> {
    const lotStartTime = moment.utc(lot.startTime);
    const lotCloseTime = moment.utc(lot.endTime);
    const now = moment.utc();
    const timeToStart = lotStartTime.diff(now, 'milliseconds');
    const timeToClose = lotCloseTime.diff(now, 'milliseconds');
    await this.queue.add('startLot', {lotId: lot.id}, { delay: timeToStart, jobId: `startLot${lot.id}` });
    await this.queue.add('closeLot', {lotId: lot.id}, { delay: timeToClose, jobId: `closeLot${lot.id}` });
  }

  async addPaymentsJobs(lot: Lot): Promise<void> {
    const now = moment.utc();
    const endTime = moment.utc(+now + 6000);
    // 3h = 10800000 ms
    const timeToStart = endTime.diff(now, 'milliseconds');
    await this.queue.add('isTheLotPayed', {lotId: lot.id}, { delay: timeToStart });
  }

  async removeLotJobs(lot: Lot): Promise<void> {
    const jobToStart: Job = await this.queue.getJob(`startLot${lot.id}`);
    const jobToEnd: Job = await this.queue.getJob(`closeLot${lot.id}`);
    if (jobToStart) { await jobToStart.remove(); }
    if (jobToEnd) { await jobToEnd.remove(); }
  }

  async createLot(createLotDto: CreateLotDto, user: User, img: globalThis.Express.Multer.File): Promise<Lot> {
    const lot  = await this.lotRepository.createLot(createLotDto, user, img);
    this.addLotJobs(lot);
    return lot;
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    return await this.lotRepository.getMyLots(filterDto, user);
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    return await this.lotRepository.getLots(filterDto, user);
  }

  async getLotById(id: number, user: User): Promise<Lot> {
    const lot = await this.lotRepository.findOne({ where: { id } });

    if (!lot) { throw new NotFoundException(`Lot with ID "${id}" not found`); }

    if (lot.status === LotStatus.CLOSED) {
      const max = await this.dbqueries.getMaxBidPrice(lot.id);
      const ownerOfMaxBid = await this.dbqueries.getOwnerOfMaxBidOfLot(max);
      const isWinner = user.id === ownerOfMaxBid.id ? true : false;
      lot.setIsWinner(isWinner);
    }
    return lot;
  }

  async deleteLotById(id: number, user: User): Promise<void> {
    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.myLogger.verbose(`User "${user.email}" can't delete lot with status not equals pending.`);
      throw new NotAcceptableException('can\'t delete lot with status not equals pending.');
    }

    if (lot.userId !== user.id) {
      this.myLogger.verbose(`User "${user.email}" can't delete not own lot.`);
      throw new NotFoundException(`Lot with ID "${id}" not found`);
    }

    try {
      await this.lotRepository.delete(lot);
      this.removeLotJobs(lot);
      this.myLogger.verbose(`User "${user.email}" deleted lot with ID "${id}".`);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateLot(id: number, updateLotDto: UpdateLotDto, user: User): Promise<Lot> {
    const {
      title,
      description,
      startTime,
      endTime,
      curentPrice,
      estimatedPrice,
    } = updateLotDto;
    const lot = await this.getLotById(id, user);

    if (lot.status !== LotStatus.PENDING) {
      this.myLogger.verbose(`User "${user.email}" can't change lot with status not equals pending.`);
      throw new NotAcceptableException('Can\'t change lot with status not equals pending.');
    }

    lot.title = title ?? lot.title;
    lot.description = description ?? lot.description;
    lot.startTime = startTime ?? lot.startTime;
    lot.endTime = endTime ?? lot.endTime;
    lot.curentPrice = curentPrice ?? lot.curentPrice;
    lot.estimatedPrice = estimatedPrice ?? lot.estimatedPrice;

    try {
      await lot.save();
      this.removeLotJobs(lot);
      this.addLotJobs(lot);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return lot;
  }

  async getLotPayment(id: number, user: User): Promise<any> {
    const lot = await this.getLotById(id, user);

    if (lot.status !== LotStatus.CLOSED || lot.isPayment) {
      this.myLogger.verbose(`lot already paid or not closed`);
      throw new NotAcceptableException('lot already paid or not closed');
    }

    const price = await this.dbqueries.getMaxBidPrice(id);
    return this.paymentService.paymentIntent(price, user);
  }

  async getSuccessPayment(id: number, user: User): Promise<any> {
    const lot = await this.getLotById(id, user);
    const owner = await this.dbqueries.getLotOwner(lot);
    const maxBid = await this.dbqueries.getMaxBidPrice(lot.id);
    const ownerOfMaxBid = await this.dbqueries.getOwnerOfMaxBidOfLot(maxBid);
    lot.isPayment = true;
    try {
      await lot.save();
      this.sendEmailService.sendEmailToTheBidsWinnerAfterSuccessPayment(
        ownerOfMaxBid.email,
        ownerOfMaxBid.firstName,
        lot.title,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
      );
      this.sendEmailService.sendEmailToTheLotOwnerAfterSuccessPayment(
        owner.email,
        owner.firstName,
        lot.title,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
