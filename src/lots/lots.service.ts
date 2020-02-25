import {
  Injectable,
  NotFoundException,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
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
import { LotsQueries } from './lots.queries';
import { BidsQueries } from '../bids/bids.queries';
import { UsersQueries } from '../auth/users.queries';

@Injectable()
export class LotsService {
  private logger = new Logger('LotsService');

  constructor(
    @InjectRepository(LotRepository)
    private lotRepository: LotRepository,
    private sendEmailService: SendEmailService,
    private lotsQueries: LotsQueries,
    private bidsQueries: BidsQueries,
    private usersQueries: UsersQueries,
  ) {}

  @Cron('0 * * * * *')
  async handleCron() {
    await this.lotsQueries
      .getLotsWhere(
        `"startTime" <= now() AND "endTime" > now() AND status = 'PENDING'`,
      )
      .then(lots => {
        lots.map(lot =>
          this.lotsQueries.changeLotsStatus(
            LotStatus.IN_PROCESS,
            `lot.id = :id`,
            { id: lot.id },
          ),
        );
      });

    await this.lotsQueries
      .getLotsWhere(`"endTime" <= now() AND status != 'CLOSED'`)
      .then(async lots => {
        await Promise.all(
          lots.map(lot =>
            this.lotsQueries.changeLotsStatus(
              LotStatus.CLOSED,
              `lot.id = :id`,
              { id: lot.id },
            ),
          ),
        );

        if (lots.length > 0) {
          lots.map(async lot => {
            const owner = await this.usersQueries.getLotOwner(lot);
            const { max: maxBid } = Object(
              await this.bidsQueries.getPriceFromMaxBidOfLot(lot.id),
            );
            if (maxBid) {
              const ownerOfMaxBid = await this.bidsQueries.getOwnerOfMaxBidOfLot(
                maxBid,
              );
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
      });
  }

  async createLot(
    createLotDto: CreateLotDto,
    user: User,
    img: globalThis.Express.Multer.File,
  ): Promise<Lot> {
    return this.lotRepository.createLot(createLotDto, user, img);
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getMyLots(filterDto, user);
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getLots(filterDto, user);
  }

  async getLotById(id: number, user: User): Promise<Lot> {
    const lot = await this.lotRepository.findOne({
      where: { id },
    });
    if (!lot) {
      throw new NotFoundException(`Lot with ID "${id}" not found`);
    }
    if (lot.status === LotStatus.CLOSED) {
      const max = await this.bidsQueries.getPriceFromMaxBidOfLot(lot.id);
      const ownerOfMaxBid = await this.bidsQueries.getOwnerOfMaxBidOfLot(max);
      const isWinner = user.id === ownerOfMaxBid.id ? true : false;
      lot.setIsWinner(isWinner);
    }
    return lot;
  }

  async deleteLotById(id: number, user: User): Promise<void> {
    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.logger.verbose(
        `User "${user.email}" can't delete lot with status not equals pending.`,
      );
      throw new NotAcceptableException(
        'can\'t delete lot with status not equals pending.',
      );
    }

    if (lot.userId !== user.id) {
      this.logger.verbose(
        `User "${user.email}" can't delete not own lot.`,
      );
      throw new NotFoundException(`Lot with ID "${id}" not found`);
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
      startTime,
      endTime,
      curentPrice,
      estimatedPrice,
    } = createLotDto;

    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.logger.verbose(
        `User "${user.email}" can't change lot with status not equals pending.`,
      );
      throw new NotAcceptableException(
        'can\'t change lot with status not equals pending.',
      );
    }

    lot.title = title ?? lot.title;
    lot.description = description ?? lot.description;
    lot.startTime = startTime ?? lot.startTime;
    lot.endTime = endTime ?? lot.endTime;
    lot.curentPrice = curentPrice ?? lot.curentPrice;
    lot.estimatedPrice = estimatedPrice ?? lot.estimatedPrice;

    await lot.save();
    return lot;
  }
}
