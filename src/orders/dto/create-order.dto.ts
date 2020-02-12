import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ArrivalType } from '../arrival-type.enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  arrivalLocation: string;

  @IsNotEmpty()
  @IsIn([
    ArrivalType.DHL_EXPRESS,
    ArrivalType.ROYAL_MAIL,
    ArrivalType.UNITED_STATES_POSTAL_SERVICE,
  ])
  arrivalType: ArrivalType;
}
