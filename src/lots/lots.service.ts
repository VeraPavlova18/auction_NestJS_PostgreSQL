import { Injectable, NotFoundException, Logger, NotAcceptableException } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';
import { Cron } from '@nestjs/schedule';
import { LotStatus } from './lot-status.enum';
import { SendEmailService } from 'src/mail/sendEmailService';
import { LotIsWinner } from './lotIsWinner.interface';

@Injectable()
export class LotsService {
  private logger = new Logger('LotsService');

  constructor(
    @InjectRepository(LotRepository)
    private lotRepository: LotRepository,
    private sendEmailService: SendEmailService,
  ) {}

  @Cron('0 * * * * *')
  async handleCron() {
    await this.lotRepository.getLotsForChangeStatus(`"startTime" <= now() AND "endTime" > now() AND status = 'PENDING'`)
      .then(lots => {
        lots.map(lot => this.lotRepository.changeLotsStatus(LotStatus.IN_PROCESS, `lot.id = :id`, {id: lot.id}));
      });

    await this.lotRepository.getLotsForChangeStatus(`"endTime" <= now() AND status != 'CLOSED'`)
      .then(async lots => {
        await Promise.all(lots.map(lot => this.lotRepository.changeLotsStatus(LotStatus.CLOSED, `lot.id = :id`, {id: lot.id})));

        if (lots.length > 0) {
          lots.map(async lot => {
            const owner = await this.lotRepository.getLotOwner(lot);
            const { max: maxBid } = Object(await this.lotRepository.getMaxBidOfLot(lot));
            if (maxBid) {
              const ownerOfMaxBid = await this.lotRepository.getOwnerOfMaxBidOfLot(maxBid);
              this.sendEmailService.sendEmailToTheBidsWinner(
                'pavlova.vera18@gmail.com', // DONT FORGET!!! change email ownerOfMaxBid.email!!!
                ownerOfMaxBid.firstName,
                lot.title,
                maxBid,
                `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
              );
            }
            this.sendEmailService.sendEmailToTheLotOwner(
              'pavlova.vera18@gmail.com', // DONT FORGET!!! change email owner.email!!!
              owner.firstName,
              lot.title,
              maxBid || lot.curentPrice,
              `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
            );

          });
        }
      });
  }

  async createLot(createLotDto: CreateLotDto, user: User): Promise<Lot> {
    return this.lotRepository.createLot(createLotDto, user);
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getMyLots(filterDto, user);
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getLots(filterDto, user);
  }

  async getLotById(id: number, user: User): Promise<LotIsWinner | Lot> {
    const lot = await this.lotRepository.findOne({
      where: { id },
    });
    if (!lot) {
      throw new NotFoundException(`Lot with ID "${id}" not found`);
    }
    if (lot.status === LotStatus.CLOSED) {
     return this.lotRepository.customizeLotWinner(lot, user);
    } else {
      return lot;
    }
  }

  async deleteLotById(id: number, user: User): Promise<void> {
    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.logger.verbose(`User "${user.email}" can't delete lot with status not equals pending.`);
      throw new NotAcceptableException('can\'t delete lot with status not equals pending.');
    }
    await this.lotRepository.delete(lot);

    this.logger.verbose(`User "${user.email}" deleted lot with ID "${id}".`);
  }

  async updateLot(
    id: number,
    createLotDto: CreateLotDto,
    user: User,
  ): Promise<Lot> {
    const {
      title,
      description,
      image,
      startTime,
      endTime,
      curentPrice,
      estimatedPrice,
    } = createLotDto;

    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.logger.verbose(`User "${user.email}" can't change lot with status not equals pending.`);
      throw new NotAcceptableException('can\'t change lot with status not equals pending.');
    }

    lot.title = title ?? lot.title;
    lot.description = description ?? lot.description;
    lot.image = image ?? lot.image;
    lot.startTime = startTime ?? lot.startTime;
    lot.endTime = endTime ?? lot.endTime;
    lot.curentPrice = curentPrice ?? lot.curentPrice;
    lot.estimatedPrice = estimatedPrice ?? lot.estimatedPrice;

    await lot.save();
    return lot;
  }
}
