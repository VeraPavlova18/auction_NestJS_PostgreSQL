import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from './lots/lot.entity';
import { User } from './auth/user.entity';
import { Bid } from './bids/bid.entity';
import { LotStatus } from './lots/lot-status.enum';

@Injectable()
export class DBqueries {
  async getLotOwner(lot: Lot): Promise<User> {
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: lot.userId })
      .getOne();
  }

  async getMaxBidPrice(id: number): Promise<number> {
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

  async getLot(id: number): Promise<Lot> {
    return getConnection()
      .createQueryBuilder()
      .select('lot')
      .from(Lot, 'lot')
      .where('lot.id = :id', { id })
      .getOne();
  }

  async getLotsWhere(condition: string): Promise<Lot[]> {
    return getConnection()
      .createQueryBuilder()
      .select('lot')
      .from(Lot, 'lot')
      .where(condition)
      .getMany();
  }

  async changeLotsStatus(
    lotStatus: LotStatus,
    condition: string,
    params: object,
  ): Promise<void> {
    await getConnection()
      .createQueryBuilder()
      .update(Lot)
      .set({ status: lotStatus })
      .where(condition, params)
      .execute();
  }

}
