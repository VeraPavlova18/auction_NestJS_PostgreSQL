import { LotStatus } from '../lot-status.enum';
import { IsNotEmpty, IsOptional, IsIn, IsNumberString } from 'class-validator';

export class GetMyLotsFilterDto {
  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  take: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  skip: string;

  @IsOptional()
  @IsIn([LotStatus.PENDING, LotStatus.IN_PROCESS, LotStatus.CLOSED])
  status: LotStatus;

  @IsOptional()
  @IsNotEmpty()
  search: string;
}
