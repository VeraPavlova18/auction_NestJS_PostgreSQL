import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

import { IsEqualValue } from '../../validation-decorators/IsEqualValue';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passport must be from 8 to 20 symbol length and matches at min: one symbol A-Z, one a-z and number or characters _, -',
  })
  password: string;

  @IsEqualValue('password')
  @IsNotEmpty()
  confirmPassword: string;
}
