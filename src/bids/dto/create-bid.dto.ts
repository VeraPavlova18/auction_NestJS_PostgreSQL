import { IsNotEmpty,  IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBidDto {

  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  proposedPrice: number;
}
