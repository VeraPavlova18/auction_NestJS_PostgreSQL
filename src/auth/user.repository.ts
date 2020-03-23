import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AuthDto } from './dto/auth.dto';
import { SignInDto } from './dto/signIn.dto';
import * as uuidv4 from 'uuid/v4';
import { ChangePassDto } from './dto/change-pass.dto';
import Stripe from 'stripe';

@EntityRepository(User)
export class UserRepository extends Repository<User> {

  async signUp(authDto: AuthDto): Promise<User> {
    const stripe = new Stripe('sk_test_2xfPRU3apxfsqSs5hrR8CDeO009wcjKI4O', { apiVersion: '2020-03-02' });
    const customer = await stripe.customers.create();

    const { firstName, lastName, email, phone, birthday, password } = authDto;
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.birthday = birthday;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.confirmToken = uuidv4();
    user.isconfirm = false;
    user.customerId = customer.id;

    const isEmailExist = await this.findOne({ email: user.email });
    if (isEmailExist) { throw new BadRequestException(`User with email: ${user.email} already exist!`); }

    const isPhoneExist = await this.findOne({ phone: user.phone });
    if (isPhoneExist) { throw new BadRequestException(`User with phone: ${user.phone} already exist!`); }

    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return user;
  }

  async validateUserPassword(signInDto: SignInDto): Promise<string> {
    const { email, password } = signInDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    } else {
      return null;
    }
  }

  async validateChangeUserPassword(
    changePasswordDto: ChangePassDto,
    email: string,
  ): Promise<string> {
    const { password } = changePasswordDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    } else {
      return null;
    }
  }

  async changePass(confirmToken: string, changePassDto: ChangePassDto): Promise<void> {
    const user = await this.getUser({ confirmToken });
    const { password } = changePassDto;

    if (!user.isconfirm) { user.isconfirm = true; }

    user.confirmToken = null;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getUser(where: object): Promise<User> {
    const found = await this.findOne({ where });

    if (!found) { throw new NotFoundException(`User not found`); }

    return found;
  }

  async isUserConfirm(signInDto: SignInDto): Promise<boolean> {
    const { email } = signInDto;
    const user = await this.findOne({ email });

    return user && user.isconfirm ? true : false;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
