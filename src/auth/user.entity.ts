import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { Lot } from '../lots/lot.entity';
import { Bid } from 'src/bids/bid.entity';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  birthday: Date;

  @Column()
  password: string;

  @OneToMany(
    type => Lot,
    lot => lot.user,
    { eager: true },
  )
  lots: Lot[];

  @OneToMany(
    type => Bid,
    bid => bid.user,
    { eager: true },
  )
  bids: Bid[];
  user: any;
}
