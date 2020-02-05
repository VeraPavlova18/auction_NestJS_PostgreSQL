import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppGateway } from 'src/app.gateway';
import { User } from 'src/auth/user.entity';
import { BidRepository } from './bid.repository';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidCustomer } from './bidCustomer.interface';

@Injectable()
export class BidsService {
  private logger = new Logger('BidsService');

  constructor(
    @InjectRepository(BidRepository)
    private bidRepository: BidRepository,
    private gateway: AppGateway,
  ) {}

  async createBid(
    user: User,
    createBidDto: CreateBidDto,
    id: number,
  ): Promise<BidCustomer> {
    return this.bidRepository.createBid(user, createBidDto, id).then(bid => {
      this.gateway.wss.emit('newBid', bid);
      return bid;
    });
  }

  async getBidsByLotId(user: User, id: number): Promise<Bid[]> {
    return this.bidRepository.getBids(user, id);
  }
}
