import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';

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
    const result = await this.lotRepository.delete({ id, userId: user.id });

    if (result.affected === 0) {
      const errMsg = `Lot with ID "${id}" not found`;
      this.logger.verbose(errMsg);
      throw new NotFoundException(errMsg);
    }
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
