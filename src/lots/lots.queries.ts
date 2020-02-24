import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { LotStatus } from './lot-status.enum';

@Injectable()
export class LotsQueries {
  async getLot(id: number): Promise<Lot> {
    return getConnection()
      .createQueryBuilder()
      .select('lot')
      .from(Lot, 'lot')
      .where('lot.id = :id', { id })
      .getOne();
  }

  async getLotOwner(lot: Lot): Promise<User> {
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: lot.userId })
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
