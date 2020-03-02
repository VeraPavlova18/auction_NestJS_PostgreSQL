import { IsNotEmpty, IsDate, IsPositive, MinDate, IsOptional } from 'class-validator';
import * as moment from 'moment';
import { Type } from 'class-transformer';
import { IsMoreThan } from '../../validation-decorators/isMoreThan';

export class UpdateLotDto {
  @IsOptional()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  @MinDate(moment().toDate())
  @Type(() => Date)
  startTime: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  @IsMoreThan('startTime', {
    message: 'End Time must be later than start Time',
  })
  @Type(() => Date)
  endTime: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  curentPrice: number;

  @IsOptional()
  @IsNotEmpty()
  @IsPositive()
  @IsMoreThan('curentPrice', {
    message: 'EstimatedPrice must be more than curentPrice',
  })
  @Type(() => Number)
  estimatedPrice: number;
}
