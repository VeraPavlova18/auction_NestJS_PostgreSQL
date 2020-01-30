import {
  Controller,
  ValidationPipe,
  Post,
  Body,
  Get,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { SignInCredentialsDto } from './dto/signIn-credential.dto';
import { User } from './user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body(ValidationPipe) signInCredentialsDto: SignInCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(signInCredentialsDto);
  }

  @Get('/confirm/:confirmToken')
  confirmUser(@Param('confirmToken') confirmToken: string): Promise<User> {
    return this.authService.confirmUser(confirmToken);
  }

  @Post('/recovery')
  sendRecoveryLink(@Body('email') email: string): Promise<void> {
    return this.authService.sendRecoveryLink(email);
  }

  @Get('/recovery-pass/:confirmToken')
  goToChangePassForm(
    @Param('confirmToken') confirmToken: string,
  ): Promise<void> {
    return this.authService.goToChangePassForm(confirmToken);
  }

  @Post('/recovery-pass/:confirmToken')
  changePassAndLoginn(
    @Param('confirmToken') confirmToken: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.changePassAndLogin(
      confirmToken,
      changePasswordDto,
    );
  }
}
