import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { OrderStatus } from './order-status.enum';
import { ArrivalType } from './arrival-type.enum';
import { Bid } from 'src/bids/bid.entity';

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

  @ManyToOne(
    type => Bid,
    bid => bid.orders,
    { eager: false },
  )
  bid: Bid;

  @Column()
  bidId: number;
}
