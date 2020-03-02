import { Controller, ValidationPipe, Post, Body, Get, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignInDto } from './dto/signIn.dto';
import { User } from './user.entity';
import { ChangePassDto } from './dto/change-pass.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UseInterceptors(ClassSerializerInterceptor)
  async signUp(@Body(ValidationPipe) authDto: AuthDto): Promise<User> {
    return this.authService.signUp(authDto);
  }

  @Post('/signin')
  signIn(@Body(ValidationPipe) signInDto: SignInDto): Promise<{ accessToken: string }> {
    return this.authService.signIn(signInDto);
  }

  @Get('/confirm/:confirmToken')
  @UseInterceptors(ClassSerializerInterceptor)
  confirmUser(@Param('confirmToken') confirmToken: string): Promise<User> {
    return this.authService.confirmUser(confirmToken);
  }

  @Post('/recovery')
  sendRecoveryLink(@Body('email') email: string): Promise<void> {
    return this.authService.sendRecoveryLink(email);
  }

  @Get('/recovery-pass/:confirmToken')
  goToChangePassForm(@Param('confirmToken') confirmToken: string): Promise<void> {
    return this.authService.goToChangePassForm(confirmToken);
  }

  @Post('/recovery-pass/:confirmToken')
  changePassAndLoginn(
    @Param('confirmToken') confirmToken: string,
    @Body(ValidationPipe) changePassDto: ChangePassDto,
  ): Promise<{ accessToken: string }> {
      return this.authService.changePassAndLogin(confirmToken, changePassDto);
  }
}
