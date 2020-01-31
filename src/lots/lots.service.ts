import { Injectable, NotFoundException, Logger, InternalServerErrorException, NotAcceptableException } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';
import { GetLotsFilterDto } from './dto/get-Lots-filter.dto copy';

@Injectable()
export class LotsService {
  private logger = new Logger('LotsService');

  constructor(
    @InjectRepository(LotRepository)
    private lotRepository: LotRepository,
  ) {}

  async createLot(createLotDto: CreateLotDto, user: User): Promise<Lot> {
    return this.lotRepository.createLot(createLotDto, user);
  }

  async getMyLots(filterDto: GetMyLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getMyLots(filterDto, user);
  }

  async getLots(filterDto: GetLotsFilterDto, user: User): Promise<Lot[]> {
    return this.lotRepository.getLots(filterDto, user);
  }

  async getLotById(id: number, user: User): Promise<Lot> {
    const found = await this.lotRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!found) {
      throw new NotFoundException(`Lot with ID "${id}" not found`);
    }
    return found;
  }

  async deleteLotById(id: number, user: User): Promise<void> {
    const lot = await this.getLotById(id, user);

    if (lot.status !== 'PENDING') {
      this.logger.verbose(`User "${user.email}" can't delete lot with status not equals pending.`);
      throw new NotAcceptableException('can\'t delete lot with status not equals pending.');
    }
    this.lotRepository.delete(lot);

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
