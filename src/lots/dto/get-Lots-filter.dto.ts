import { IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';

export class GetLotsFilterDto {
  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  take: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  skip: string;

  @IsOptional()
  @IsNotEmpty()
  search: string;
}
