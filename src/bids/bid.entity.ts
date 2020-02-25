import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Lot } from '../lots/lot.entity';
import { Order } from '../orders/order.entity';
import { Exclude, Expose } from 'class-transformer';

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

  @Exclude({ toPlainOnly: true })
  @Column()
  userId: number;

  @Exclude({ toPlainOnly: true })
  private loggedUserId: number;
  setLoggedUserId(id: number) {
    this.loggedUserId = id;
  }

  @Exclude({ toPlainOnly: true })
  private customer: string;
  @Expose()
  setCustomer() {
    return this.customer = this.userId === this.loggedUserId
      ? `You`
      : `Customer ${Math.floor(Math.random() * 100000 + 1)}`;
  }
}
