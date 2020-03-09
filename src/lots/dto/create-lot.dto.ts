import { IsNotEmpty, IsDate, IsPositive, MinDate } from 'class-validator';
import * as moment from 'moment';
import { Type } from 'class-transformer';
import { IsMoreThan } from '../../validation-decorators/isMoreThan';

export class CreateLotDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsDate()
  @MinDate(moment.utc().toDate())
  @Type(() => Date)
  startTime: Date;

  @IsNotEmpty()
  @IsDate()
  @IsMoreThan('startTime', {
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
  @IsMoreThan('curentPrice', {
    message: 'EstimatedPrice must be more than curentPrice',
  })
  @Type(() => Number)
  estimatedPrice: number;
}
