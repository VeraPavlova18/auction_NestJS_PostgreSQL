import { EntityRepository, Repository, getConnection, In } from 'typeorm';
import { Lot } from './lot.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { User } from '../auth/user.entity';
import { LotStatus } from './lot-status.enum';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import * as moment from 'moment';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';
import { LotIsWinner } from './lotIsWinner.interface';
import { Bid } from '../bids/bid.entity';

@EntityRepository(Lot)
export class LotRepository extends Repository<Lot> {
  private logger = new Logger('LotRepository');

  async customizeLotWinner(lot: Lot, user: User): Promise<LotIsWinner> {
    // const { max: maxBid } = Object(await this.getMaxBidOfLot(lot));
    // const ownerOfMaxBid = await this.getOwnerOfMaxBidOfLot(maxBid);
    // const isWinner = user.id === ownerOfMaxBid.id ? true : false;
    return {
      ...lot,
      // isWinner
    } as LotIsWinner;
  }

  async createLot(
    createLotDto: CreateLotDto,
    user: User,
    img: globalThis.Express.Multer.File,
  ): Promise<Lot> {
    const {
      title,
      description,
      startTime,
      endTime,
      curentPrice,
      estimatedPrice,
    } = createLotDto;

    const lot = new Lot();
    lot.title = title;
    lot.description = description;
    lot.startTime = startTime;
    lot.endTime = endTime;
    lot.curentPrice = curentPrice;
    lot.estimatedPrice = estimatedPrice;
    lot.status = LotStatus.PENDING;
    lot.createdAt = moment().toDate();
    lot.user = user;
    lot.image = img ? img.path
      .split('/')
      .slice(1)
      .join('/') : '';

    try {
      await lot.save();
    } catch (error) {
      this.logger.error(
        `Failed to create a lot for user ${user.email}. Data: ${createLotDto}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    delete lot.user;
    return lot;
  }

  async getLotOwner(lot: Lot): Promise<User> {
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: lot.userId })
      .getOne();
  }

  async changeLotsStatus(
    lotStatus: LotStatus,
    condition: string,
    params: object,
  ): Promise<void> {
    await getConnection()
      .createQueryBuilder()
      .update(Lot)
      .set({ status: lotStatus })
      .where(condition, params)
      .execute();
  }

  async getMyBids(user: User): Promise<Bid[]> {
    return await getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.userId = :id', { id: user.id })
      .getMany();
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    const { status, search, take = 10, skip = 0 } = filterDto;
    const myBids = await this.getMyBids(user);
    const query = this.createQueryBuilder('lot');

    if (myBids.length > 0) {
      const myLotsIdFromMyBids = [];
      myBids.map(bid => myLotsIdFromMyBids.push(bid.lotId));
      query.where('lot.userId = :userId OR lot.id IN (:...ids)', {
        userId: user.id,
        ids: myLotsIdFromMyBids,
      });
    } else {
      query.where('lot.userId = :userId', { userId: user.id });
    }

    if (status) {
      query.andWhere('lot.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        '(lot.title LIKE :search OR lot.description LIKE :search)',
        { search: `%${search}%` },
      );
    }
    try {
      return await query
        .take(Math.abs(+take))
        .skip(Math.abs(+skip))
        .orderBy('lot.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get lots for user "${user.email}". Filters: ${JSON.stringify(
          filterDto,
        )}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    const { search, take = 10, skip = 0 } = filterDto;
    const query = this.createQueryBuilder('lot');
    query.where('lot.status = :status', { status: 'IN_PROCESS' });

    if (search) {
      query.andWhere(
        '(lot.title LIKE :search OR lot.description LIKE :search)',
        { search: `%${search}%` },
      );
    }
    try {
      return await query
        .take(Math.abs(+take))
        .skip(Math.abs(+skip))
        .orderBy('lot.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get lots for user "${user.email}". Filters: ${JSON.stringify(
          filterDto,
        )}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
