import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Lot } from '../lots/lot.entity';
import { Bid } from '../bids/bid.entity';
import { Exclude } from 'class-transformer';

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

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  salt: string;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  confirmToken: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  isconfirm: boolean;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  customerId: string;

  @OneToMany(
    type => Lot,
    lot => lot.user,
    { eager: true },
  )
  @Exclude({ toPlainOnly: true })
  lots: Lot[];

  @OneToMany(
    type => Bid,
    bid => bid.user,
    { eager: true },
  )
  @Exclude({ toPlainOnly: true })
  bids: Bid[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
