import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Lot } from '../lots/lot.entity';
import { Order } from '../orders/order.entity';

@Entity()
export class Bid extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamp with time zone',
  })
  creationTime: Date;

  @Column()
  proposedPrice: number;

  @ManyToOne(
    type => User,
    user => user.bids,
    { eager: false },
  )
  user: User;

  @ManyToOne(
    type => Lot,
    lot => lot.bids,
    { eager: false },
  )
  lot: Lot;

  @OneToOne(
    type => Order,
    order => order.bid,
  )
  order: Order;

  @Column()
  lotId: number;

  @Column()
  userId: number;
}
