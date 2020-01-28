import { EntityRepository, Repository } from 'typeorm';
import { Lot } from './lot.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { User } from '../auth/user.entity';
import { LotStatus } from './lot-status.enum';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import * as moment from 'moment';

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
        `Failed to create a lot for user . Data: `,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    delete lot.user;
    return lot;
  }
}
