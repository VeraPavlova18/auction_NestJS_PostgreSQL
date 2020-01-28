import { Injectable } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LotRepository } from './lot.repository';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';

@Injectable()
export class LotsService {
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

}
