import {
  IsNotEmpty,
  IsDate,
  IsPositive,
  MinDate,
} from 'class-validator';
import * as moment from 'moment';
import { Type } from 'class-transformer';
import { NumberIsMoreThan } from '../../validation-decorators/numberIsMoreThan';
import { ObjIsMoreThan } from '../../validation-decorators/objIsMoreThan';

export class CreateLotDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  image: string;

  @IsNotEmpty()
  @IsDate()
  @MinDate(moment().toDate())
  @Type(() => Date)
  startTime: Date;

  @IsNotEmpty()
  @IsDate()
  @ObjIsMoreThan('startTime', {
    message: 'End Time must be later than start Time',
  })
  @Type(() => Date)
  endTime: Date;

  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  curentPrice: number;

  @IsNotEmpty()
  @IsPositive()
  @NumberIsMoreThan('curentPrice', {
    message: 'EstimatedPrice must be more than curentPrice',
  })
  @Type(() => Number)
  estimatedPrice: number;
}
