import { Injectable, NotFoundException, Logger, NotAcceptableException, InternalServerErrorException } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';
import { Cron } from '@nestjs/schedule';
import { LotStatus } from './lot-status.enum';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { UpdateLotDto } from './dto/update-lot.dto copy';

@Injectable()
export class LotsService {
  private logger = new Logger('LotsService');

  constructor(
    @InjectRepository(LotRepository)
    private lotRepository: LotRepository,
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
  ) {}

  @Cron('0 * * * * *')
  async handleCron() {
    const lotsInProcess = await this.dbqueries.getLotsWhere(`"startTime" <= now() AND "endTime" > now() AND status = 'PENDING'`);
    await Promise.all(lotsInProcess.map(lot => this.dbqueries.changeLotsStatus(LotStatus.IN_PROCESS, `lot.id = :id`, { id: lot.id })));

    const lotsClosed = await this.dbqueries.getLotsWhere(`"endTime" <= now() AND status != 'CLOSED'`);
    await Promise.all(lotsClosed.map(lot => this.dbqueries.changeLotsStatus(LotStatus.CLOSED, `lot.id = :id`, { id: lot.id })));

    if (lotsClosed.length > 0) {
      lotsClosed.map(async lot => {
        const owner = await this.dbqueries.getLotOwner(lot);
        const { max: maxBid } = Object(await this.dbqueries.getMaxBidPrice(lot.id));

        if (maxBid) {
          const ownerOfMaxBid = await this.dbqueries.getOwnerOfMaxBidOfLot(maxBid);
          this.sendEmailService.sendEmailToTheBidsWinner(
            ownerOfMaxBid.email,
            ownerOfMaxBid.firstName,
            lot.title,
            maxBid,
            `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
          );
        }

        this.sendEmailService.sendEmailToTheLotOwner(
          owner.email,
          owner.firstName,
          lot.title,
          maxBid || lot.curentPrice,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
      });
    }
  }

  async createLot(createLotDto: CreateLotDto, user: User, img: globalThis.Express.Multer.File): Promise<Lot> {
    return this.lotRepository.createLot(createLotDto, user, img);
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getMyLots(filterDto, user);
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getLots(filterDto, user);
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
      this.logger.verbose(`User "${user.email}" can't delete lot with status not equals pending.`);
      throw new NotAcceptableException('can\'t delete lot with status not equals pending.');
    }

    if (lot.userId !== user.id) {
      this.logger.verbose(`User "${user.email}" can't delete not own lot.`);
      throw new NotFoundException(`Lot with ID "${id}" not found`);
    }

    try {
      await this.lotRepository.delete(lot);
      this.logger.verbose(`User "${user.email}" deleted lot with ID "${id}".`);
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
      this.logger.verbose(`User "${user.email}" can't change lot with status not equals pending.`);
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
