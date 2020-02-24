import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from '../lots/lot.entity';
import { Bid } from './bid.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class BidsQueries {
  async getPriceFromMaxBidOfLot(lot: Lot): Promise<object> {
    return getConnection()
      .createQueryBuilder()
      .select('Max(bid.proposedPrice)', 'max')
      .from(Bid, 'bid')
      .where('bid.lotId = :lotId', { lotId: lot.id })
      .getRawOne();
  }

  async getmaxBidOfLot(max: number) {
    return getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.proposedPrice = :max', { max })
      .getOne();
  }

  async getOwnerOfMaxBidOfLot(max: number): Promise<User> {
    const maxBid = await this.getmaxBidOfLot(max);

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
