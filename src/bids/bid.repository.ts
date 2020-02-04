import { EntityRepository, Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import * as moment from 'moment';
import { BidCustomer } from './bidCustomer.interface';

@EntityRepository(Bid)
export class BidRepository extends Repository<Bid> {
  private logger = new Logger('BidRepository');

  async createBid(user: User, createBidDto: CreateBidDto, id: number): Promise<BidCustomer> {
    const { proposedPrice } = createBidDto;

    const bid = new Bid();
    bid.proposedPrice = proposedPrice;
    bid.creationTime = moment().toDate();
    bid.user = user;
    bid.lotId = id;

    try {
      await bid.save();
    } catch (error) {
      this.logger.error(
        `Failed to create a Bid for user ${user.email}. Data: ${createBidDto}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    delete bid.user;
    delete bid.userId;
    let customer;
    if (bid.userId === user.id) {
      customer = `You`;
    } else {
      customer = `Customer ${Math.floor(Math.random() * 100000 + 1)}`;
    }
    return {
      ...bid,
      customer,
    } as BidCustomer;
  }

  async getBids(user: User, id: number): Promise<BidCustomer[]> {
    const query = this.createQueryBuilder('bid');
    let customer;
    try {
      const bids = await query
        .where('bid.lotId = :lotId', { lotId: id })
        .getMany();

      return bids.map((bid) => {
        if (bid.userId === user.id) {
          customer = `You`;
        } else {
          customer = `Customer ${Math.floor(Math.random() * 100000 + 1)}`;
        }
        delete bid.userId;
        return {
          ...bid,
          customer,
        };
      }) as BidCustomer[];
    } catch (error) {
      this.logger.error(
        `Failed to get bids for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
