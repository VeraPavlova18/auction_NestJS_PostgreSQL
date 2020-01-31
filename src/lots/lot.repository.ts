import { EntityRepository, Repository, getConnection } from 'typeorm';
import { Lot } from './lot.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { User } from '../auth/user.entity';
import { LotStatus } from './lot-status.enum';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import * as moment from 'moment';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto';

@EntityRepository(Lot)
export class LotRepository extends Repository<Lot> {
  private logger = new Logger('LotRepository');

  async createLot(createLotDto: CreateLotDto, user: User): Promise<Lot> {
    const {
      title,
      description,
      image,
      startTime,
      endTime,
      curentPrice,
      estimatedPrice,
    } = createLotDto;

    const lot = new Lot();
    lot.title = title;
    lot.description = description;
    lot.image = image;
    lot.startTime = startTime;
    lot.endTime = endTime;
    lot.curentPrice = curentPrice;
    lot.estimatedPrice = estimatedPrice;
    lot.status = LotStatus.PENDING;
    lot.createdAt = moment().toDate();
    lot.user = user;

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

  async changeLotStatus(): Promise<void> {
    await getConnection()
    .createQueryBuilder()
    .update(Lot)
    .set({ status: LotStatus.IN_PROCESS })
    .where('startTime <= now()')
    .execute();
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('lot');

    query.where('lot.userId = :userId', { userId: user.id });

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
      const lots = await query.getMany();
      return lots;
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

    if (search) {
      query.andWhere(
        '(lot.title LIKE :search OR lot.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    try {
      const lots = await query
        .where('lot.status = :status', { status: 'IN_PROCESS' })
        .take(Math.abs(+take))
        .skip(Math.abs(+skip))
        .getMany();
      return lots;
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
