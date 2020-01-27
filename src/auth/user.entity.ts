import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Lot } from '../lots/lot.entity';
import { Bid } from 'src/bids/bid.entity';
import * as bcript from 'bcrypt';

@Entity()
@Unique(['phone'])
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

  @Column()
  salt: string;

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

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcript.hash(password, this.salt);
    return hash === this.password;
  }
}
