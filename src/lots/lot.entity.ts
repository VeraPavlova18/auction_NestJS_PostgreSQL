import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LotStatus } from './lot-status.enum';
import { User } from '../auth/user.entity';
import { Bid } from '../bids/bid.entity';

@Entity()
export class Lot extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column()
  createdAt: Date;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  curentPrice: number;

  @Column()
  estimatedPrice: number;

  @Column()
  status: LotStatus;

  @ManyToOne(
    type => User,
    user => user.lots,
    { eager: false },
  )
  user: User;

  @Column()
  userId: number;

  @OneToMany(
    type => Bid,
    bid => bid.lot,
    { eager: true },
  )
  bids: Bid[];
}
