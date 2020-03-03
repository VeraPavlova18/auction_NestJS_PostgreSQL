import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppGateway } from '../app.gateway';
import { User } from '../auth/user.entity';
import { BidRepository } from './bid.repository';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from 'src/logger/my-logger.service';

@Injectable()
export class BidsService {

  constructor(
    @InjectRepository(BidRepository)
    private bidRepository: BidRepository,
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private gateway: AppGateway,
    private readonly myLogger: MyLogger,
  ) {
    this.myLogger.setContext('BidsService');
  }

  async createBid(user: User, createBidDto: CreateBidDto, id: number): Promise<Bid> {
    const bid = await this.bidRepository.createBid(user, createBidDto, id);
    this.gateway.wss.emit('newBid', bid);
    const lot = await this.dbqueries.getLot(id);
    const maxBid = +bid.proposedPrice;

    if (maxBid === lot.estimatedPrice) {
      const owner = await this.dbqueries.getLotOwner(lot);
      const ownerOfMaxBid = user;

      this.sendEmailService.sendEmailToTheBidsWinner(
        ownerOfMaxBid.email,
        ownerOfMaxBid.firstName,
        lot.title,
        maxBid,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/lots/${lot.id}`,
      );

      this.sendEmailService.sendEmailToTheLotOwner(
        owner.email,
        owner.firstName,
        lot.title,
        maxBid || lot.curentPrice,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/lots/${lot.id}`,
      );
    }
    this.myLogger.debug(`Created new bid for lot with id:${id}`);
    return bid;
  }

  async getBidsByLotId(user: User, id: number): Promise<Bid[]> {
    return this.bidRepository.getBids(user, id);
  }
}
