import { EntityRepository, Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { SignInCredentialsDto } from './dto/signIn-credential.dto';
import * as uuidv4 from 'uuid/v4';
import { ChangePasswordDto } from './dto/change-password.dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const {
      firstName,
      lastName,
      email,
      phone,
      birthday,
      password,
    } = authCredentialsDto;

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

    try {
      return user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(error.detail);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(
    signInCredentialsDto: SignInCredentialsDto,
  ): Promise<string> {
    const { email, password } = signInCredentialsDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    } else {
      return null;
    }
  }

  async validateChangeUserPassword(
    changePasswordDto: ChangePasswordDto,
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

  async changePass(
    confirmToken: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.getUser({ confirmToken });
    const { password } = changePasswordDto;

    if (!user.isconfirm) {
      user.isconfirm = true;
    }
    user.confirmToken = null;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    await user.save();
  }

  async getUser(where: object): Promise<User> {
    const found = await this.findOne({ where });
    if (!found) {
      throw new NotFoundException(`User not found`);
    }
    return found;
  }

  async isUserConfirm(
    signInCredentialsDto: SignInCredentialsDto,
  ): Promise<boolean> {
    const { email } = signInCredentialsDto;
    const user = await this.findOne({ email });
    return user && user.isconfirm ? true : false;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
