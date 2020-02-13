import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { SignInCredentialsDto } from './dto/signIn-credential.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { SendEmailService } from '../mail/sendEmailService';
import { User } from './user.entity';
import * as uuidv4 from 'uuid/v4';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private sendEmailService: SendEmailService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.userRepository.signUp(authCredentialsDto)
      .then(user => {
        return this.sendEmailService.sendConfirmEmail(
        user.email,
        user.firstName,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/confirm/${user.confirmToken}`,
      );
    });
  }

  async confirmUser(confirmToken: string): Promise<User> {
    const user = await this.userRepository.getUser({ confirmToken });
    user.isconfirm = true;
    user.confirmToken = null;
    await user.save();
    delete user.password;
    delete user.salt;
    delete user.lots;
    delete user.bids;
    return user;
  }

  async sendRecoveryLink(email: string): Promise<void> {
    const user = await this.userRepository.getUser({ email });
    if (!user.confirmToken) {
      user.confirmToken = uuidv4();
    }
    await user.save();
    await this.sendEmailService.sendRecoveryEmail(
      user.email,
      user.firstName,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/recovery-pass/${user.confirmToken}`,
    );
  }

  async changePassAndLogin(
    confirmToken: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ accessToken: string }> {
    const email = await (await this.userRepository.getUser({ confirmToken }))
      .email;
    await this.userRepository.changePass(confirmToken, changePasswordDto);
    return this.signInAfterChangePass(changePasswordDto, email);
  }

  async goToChangePassForm(confirmToken: string): Promise<void> {
    await this.userRepository.getUser({ confirmToken });
  }

  async signIn(
    signInCredentialsDto: SignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const isConfirm = await this.userRepository.isUserConfirm(
      signInCredentialsDto,
    );
    if (!isConfirm) {
      throw new UnauthorizedException('Confirm your email address');
    }

    const email = await this.userRepository.validateUserPassword(
      signInCredentialsDto,
    );
    if (!email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { email };
    const accessToken = await this.jwtService.sign(payload);
    this.logger.debug(
      `Generated JWT Token with payload ${JSON.stringify(payload)}`,
    );

    return { accessToken };
  }

  async signInAfterChangePass(
    changePasswordDto: ChangePasswordDto,
    email: string,
  ): Promise<{ accessToken: string }> {
    email = await this.userRepository.validateChangeUserPassword(
      changePasswordDto,
      email,
    );
    if (!email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { email };
    const accessToken = await this.jwtService.sign(payload);
    this.logger.debug(
      `Generated JWT Token with payload ${JSON.stringify(payload)}`,
    );

    return { accessToken };
  }
}
