import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import * as bcript from 'bcrypt';
import { Lot } from '../lots/lot.entity';
import { Bid } from '../bids/bid.entity';

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

  @Column({
    nullable: true,
  })
  confirmToken: string;

  @Column()
  isconfirm: boolean;

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

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcript.hash(password, this.salt);
    return hash === this.password;
  }
}
