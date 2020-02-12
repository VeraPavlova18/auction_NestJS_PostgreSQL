import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppGateway } from '../app.gateway';
import { User } from '../auth/user.entity';
import { BidRepository } from './bid.repository';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidCustomer } from './bidCustomer.interface';
import { SendEmailService } from '../mail/sendEmailService';

@Injectable()
export class BidsService {
  private logger = new Logger('BidsService');

  constructor(
    @InjectRepository(BidRepository)
    private bidRepository: BidRepository,
    private sendEmailService: SendEmailService,
    private gateway: AppGateway,
  ) {}

  async createBid(
    user: User,
    createBidDto: CreateBidDto,
    id: number,
  ): Promise<BidCustomer> {
    return this.bidRepository
      .createBid(user, createBidDto, id)
      .then(bid => {
        this.gateway.wss.emit('newBid', bid);
        return bid;
      })
      .then(async bid => {
        const lot = await this.bidRepository.getLot(id);
        const maxBid = +bid.proposedPrice;
        if (maxBid === lot.estimatedPrice) {
          const owner = await this.bidRepository.getLotOwner(lot);
          const ownerOfMaxBid = user;

          this.sendEmailService.sendEmailToTheBidsWinner(
            ownerOfMaxBid.email,
            ownerOfMaxBid.firstName,
            lot.title,
            maxBid,
            `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
          );

          this.sendEmailService.sendEmailToTheLotOwner(
            owner.email,
            owner.firstName,
            lot.title,
            maxBid || lot.curentPrice,
            `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
          );
        }

        return bid;
      });
  }

  async getBidsByLotId(user: User, id: number): Promise<Bid[]> {
    return this.bidRepository.getBids(user, id);
  }
}
