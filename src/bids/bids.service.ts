import { Injectable, Logger } from '@nestjs/common';
import { BidRepository } from './bid.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBidDto } from './dto/create-bid.dto';
import { User } from 'src/auth/user.entity';
import { Bid } from './bid.entity';

@Injectable()
export class BidsService {
  private logger = new Logger('BidsService');

  constructor(
    @InjectRepository(BidRepository)
    private bidRepository: BidRepository,
  ) {}

  async createLot(user: User, createBidDto: CreateBidDto, id: number): Promise<Bid> {
    return this.bidRepository.createBid(user, createBidDto, id);
  }

  async getBidsByLotId(user: User, id: number): Promise<Bid[]> {
    return this.bidRepository.getBids(user, id);
  }

}
