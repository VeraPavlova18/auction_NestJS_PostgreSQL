import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { LotStatus } from './lot-status.enum';
import { User } from 'src/auth/user.entity';
import { Bid } from 'src/bids/bid.entity';

@Entity()
export class Lot extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column()
  createdAt: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column()
  curentPrice: number;

  @Column()
  estimatedPrice: number;

  @Column()
  status: LotStatus;

  @ManyToOne(type => User, user => user.lots, { eager: false })
  user: User;

  @OneToMany(type => Bid, bid => bid.lot, { eager: true })
  bids: Bid[];

  @Column()
  ownerId: number;
}