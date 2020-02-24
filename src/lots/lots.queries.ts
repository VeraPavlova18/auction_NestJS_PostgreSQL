import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';

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
}
