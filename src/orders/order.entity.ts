import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from './order-status.enum';
import { ArrivalType } from './arrival-type.enum';
import { Bid } from '../bids/bid.entity';

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  arrivalLocation: string;

  @Column()
  arrivalType: ArrivalType;

  @Column()
  status: OrderStatus;

  @OneToOne(
    type => Bid,
    bid => bid.order,
  )
  @JoinColumn()
  bid: Bid;

  @Column()
  bidId: number;
}
