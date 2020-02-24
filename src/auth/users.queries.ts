import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Lot } from '../lots/lot.entity';
import { User } from './user.entity';

@Injectable()
export class UsersQueries {
  async getLotOwner(lot: Lot): Promise<User> {
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: lot.userId })
      .getOne();
  }
}
