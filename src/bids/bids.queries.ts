import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from '../lots/lot.entity';
import { Bid } from './bid.entity';
import { User } from '../auth/user.entity';
import { max } from 'moment';

@Injectable()
export class BidsQueries {
  async getPriceFromMaxBidOfLot(id: number): Promise<number> {
    const maxObj = await getConnection()
      .createQueryBuilder()
      .select('Max(bid.proposedPrice)', 'max')
      .from(Bid, 'bid')
      .where('bid.lotId = :lotId', { lotId: id })
      .getRawOne();
    return maxObj.max;
  }

  async getmaxBidOfLot(maxPrice: number) {
    return getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.proposedPrice = :max', { max: maxPrice })
      .getOne();
  }

  async getOwnerOfMaxBidOfLot(maxPrice: number): Promise<User> {
    const maxBid = await this.getmaxBidOfLot(maxPrice);

    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: maxBid.userId })
      .getOne();
  }

  async getMyBids(user: User): Promise<Bid[]> {
    return await getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.userId = :id', { id: user.id })
      .getMany();
  }
}
