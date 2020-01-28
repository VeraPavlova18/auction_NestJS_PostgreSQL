import {
  Controller,
  UseGuards,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Logger,
  Get,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { Lot } from './lot.entity';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { GetMyLotsFilterDto } from './dto/get-myLots-filter.dto';

@Controller('lots')
@UseGuards(AuthGuard('jwt'))
export class LotsController {
  private logger = new Logger('LotsController');

  constructor(private lotsService: LotsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  createLot(
    @Body() createLotDto: CreateLotDto,
    @GetUser() user: User,
  ): Promise<Lot> {
    return this.lotsService.createLot(createLotDto, user);
  }

  @Get()
  getMyLots(
    @Query(ValidationPipe) filterDto: GetMyLotsFilterDto,
    @GetUser() user: User,
  ): Promise<Lot[]> {
    this.logger.verbose(
      `User "${user.email}" retrieving all lots. Filters: ${JSON.stringify(
        filterDto,
      )}`,
    );
    return this.lotsService.getMyLots(filterDto, user);
  }

}
