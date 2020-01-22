import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/auth/user.entity';
import { Lot } from 'src/lots/lot.entity';
import { Order } from 'src/orders/order.entity';

@Entity()
export class Bid extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creationTime: string;

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

  @OneToMany(
    type => Order,
    order => order.bid,
    { eager: true },
  )
  orders: Order[];

  @Column()
  lotId: number;

  @Column()
  customerId: number;
}
