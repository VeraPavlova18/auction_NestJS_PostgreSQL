import { IsNotEmpty, IsDate, IsPositive, MaxDate, MinDate, Min, Max } from 'class-validator';
import * as moment from 'moment';
import { Type } from 'class-transformer';
import { Lot } from '../lot.entity';

export class CreateLotDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  image: string;

  @IsNotEmpty()
  @IsDate()
  @MaxDate(moment().toDate())
  @Type(() => Date)
  startTime: Date;

  @IsNotEmpty()
  @IsDate()
  // @MinDate(this.startTime)
  @Type(() => Date)
  endTime: Date;

  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  curentPrice: number;

  @IsNotEmpty()
  @IsPositive()
  // @Max(this.curentPrice)
  @Type(() => Number)
  estimatedPrice: number;

}
