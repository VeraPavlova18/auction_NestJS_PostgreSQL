import { LotStatus } from '../lot-status.enum';
import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class GetMyLotsFilterDto {
  @IsOptional()
  @IsIn([LotStatus.PENDING, LotStatus.IN_PROCESS, LotStatus.CLOSED])
  status: LotStatus;

  @IsOptional()
  @IsNotEmpty()
  search: string;
}
