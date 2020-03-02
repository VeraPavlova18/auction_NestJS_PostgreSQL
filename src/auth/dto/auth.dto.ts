import * as moment from 'moment';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsEmail,
  IsDate,
  MaxDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName: string;

  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(60)
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/, {
    message: 'Invalid phone number',
  })
  phone: string;

  @IsNotEmpty()
  @IsDate()
  @MaxDate(
    moment()
      .subtract(21, 'years')
      .toDate(),
  )
  @Type(() => Date)
  birthday: Date;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passport must be from 8 to 20 symbol length and matches at min: one symbol A-Z, one a-z and number or characters _, -',
  })
  password: string;
}
