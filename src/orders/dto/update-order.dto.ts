import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { ArrivalType } from '../arrival-type.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  arrivalLocation: string;

  @IsOptional()
  @IsNotEmpty()
  @IsIn([
    ArrivalType.DHL_EXPRESS,
    ArrivalType.ROYAL_MAIL,
    ArrivalType.UNITED_STATES_POSTAL_SERVICE,
  ])
  arrivalType: ArrivalType;
}
