import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { SignInCredentialsDto } from './dto/signIn-credential.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { SendEmailService } from 'src/mail/sendEmailService';
import { User } from './user.entity';

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
    return this.userRepository.signUp(authCredentialsDto).then(user =>
      this.sendEmailService.sendConfirmEmail(
        'pavlova.vera18@gmail.com', // DONT FORGET!!! change to user.email
        user.firstName,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/auth/confirm/${user.confirmToken}`,
      ),
    );
  }

  async getUserByConfirmToken(confirmToken: string): Promise<User> {
    const found = await this.userRepository.findOne({
      where: { confirmToken },
    });
    if (!found) {
      throw new NotFoundException(
        `User with confirmToken "${confirmToken}" not found`,
      );
    }
    return found;
  }

  async confirmUser(confirmToken: string): Promise<User> {
    const user = await this.getUserByConfirmToken(confirmToken);
    user.isconfirm = true;
    user.confirmToken = null;
    await user.save();
    return user;
  }

  async signIn(
    signInCredentialsDto: SignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const isConfirm = await this.userRepository.IsUserConfirm(
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
}
