import { Injectable, Logger, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppGateway } from '../app.gateway';
import { User } from '../auth/user.entity';
import { BidRepository } from './bid.repository';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { SendEmailService } from '../mail/sendEmailService';
import { LotsQueries } from '../lots/lots.queries';

@Injectable()
export class BidsService {
  private logger = new Logger('BidsService');

  constructor(
    @InjectRepository(BidRepository)
    private bidRepository: BidRepository,
    private sendEmailService: SendEmailService,
    private lotsQueries: LotsQueries,
    // private gateway: AppGateway,
  ) {}

  async createBid(
    user: User,
    createBidDto: CreateBidDto,
    id: number,
  ): Promise<Bid> {
    return this.bidRepository
      .createBid(user, createBidDto, id)
      .then(bid => {
        // this.gateway.wss.emit('newBid', bid);
        return bid;
      })
      .then(async bid => {
        const lot = await this.lotsQueries.getLot(id);
        const maxBid = +bid.proposedPrice;
        if (maxBid === lot.estimatedPrice) {
          const owner = await this.lotsQueries.getLotOwner(lot);
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
