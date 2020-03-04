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
import { Queue } from 'bull';

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotRepository) private lotRepository: LotRepository,
    @InjectQueue('lots') private readonly lotsQueue: Queue,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
  ) {
      const cron = '0 * * * * *';
      this.myLogger.setContext('LotsService');
      this.lotsQueue.add({}, { priority: 1, repeat: { cron } });
  }

  async createLot(createLotDto: CreateLotDto, user: User, img: globalThis.Express.Multer.File): Promise<Lot> {
    return await this.lotRepository.createLot(createLotDto, user, img);
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

    if (lot.status !== 'PENDING') {
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
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return lot;
  }
}
