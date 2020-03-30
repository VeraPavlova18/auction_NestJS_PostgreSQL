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
import { Expose, Exclude } from 'class-transformer';

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

  @Column({
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp with time zone',
  })
  startTime: Date;

  @Column({
    type: 'timestamp with time zone',
  })
  endTime: Date;

  @Column()
  curentPrice: number;

  @Column()
  estimatedPrice: number;

  @Column()
  status: LotStatus;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  isPayment: boolean;

  @ManyToOne(
    type => User,
    user => user.lots,
    { eager: false },
  )
  @Exclude({ toPlainOnly: true })
  user: User;

  @Exclude({ toPlainOnly: true })
  @Column()
  userId: number;

  @Exclude({ toPlainOnly: true })
  @OneToMany(
    type => Bid,
    bid => bid.lot,
    { eager: true },
  )
  bids: Bid[];

  private isWinner: boolean;
  setIsWinner(param) {
    this.isWinner = param;
  }
}
