import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthDto } from './dto/auth.dto';
import { SignInDto } from './dto/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { SendEmailService } from '../mail/sendEmailService';
import { User } from './user.entity';
import * as uuidv4 from 'uuid/v4';
import { ChangePassDto } from './dto/change-pass.dto';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private sendEmailService: SendEmailService,
  ) {}

  async signUp(authDto: AuthDto): Promise<User> {
    const user = await this.userRepository.signUp(authDto);
    this.sendEmailService.sendConfirmEmail(
      user.email,
      user.firstName,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/confirm/${user.confirmToken}`,
    );

    return user;
  }

  async confirmUser(confirmToken: string): Promise<User> {
    const user = await this.userRepository.getUser({ confirmToken });
    user.isconfirm = true;
    user.confirmToken = null;

    try {
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return user;
  }

  async sendRecoveryLink(email: string): Promise<void> {
    const user = await this.userRepository.getUser({ email });

    if (!user.confirmToken) {
      user.confirmToken = uuidv4();
      try {
        await user.save();
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }

    this.sendEmailService.sendRecoveryEmail(
      user.email,
      user.firstName,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/recovery-pass/${user.confirmToken}`,
    );
  }

  async changePassAndLogin(confirmToken: string, changePassDto: ChangePassDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.getUser({ confirmToken });
    await this.userRepository.changePass(confirmToken, changePassDto);
    return this.signInAfterChangePass(changePassDto, user.email);
  }

  async goToChangePassForm(confirmToken: string): Promise<void> {
    await this.userRepository.getUser({ confirmToken });
  }

  async signIn(signInDto: SignInDto): Promise<{ accessToken: string }> {
    const email = await this.userRepository.validateUserPassword(signInDto);

    if (!email) { throw new UnauthorizedException('Invalid credentials'); }

    const isConfirm = await this.userRepository.isUserConfirm(signInDto);
    if (!isConfirm) { throw new UnauthorizedException('Confirm your email address'); }

    const payload: JwtPayload = { email };
    const accessToken = await this.jwtService.sign(payload);
    this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);
    return { accessToken };
  }

  async signInAfterChangePass(changePassDto: ChangePassDto, email: string): Promise<{ accessToken: string }> {
    email = await this.userRepository.validateChangeUserPassword(changePassDto, email);

    if (!email) { throw new UnauthorizedException('Invalid credentials'); }

    const payload: JwtPayload = { email };
    const accessToken = await this.jwtService.sign(payload);
    this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);
    return { accessToken };
  }
}
