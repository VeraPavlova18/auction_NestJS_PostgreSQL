import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  ParseIntPipe,
  Param,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { Bid } from './bid.entity';

@Controller('lots/:id/bids')
@UseGuards(AuthGuard('jwt'))
export class BidsController {
  private logger = new Logger('BidsController');
  constructor(private bidsService: BidsService) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(ValidationPipe)
  createBid(
    @GetUser() user: User,
    @Body() createBidDto: CreateBidDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Bid> {
    return this.bidsService.createBid(user, createBidDto, id);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  getBidsByLotId(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Bid[]> {
    return this.bidsService.getBidsByLotId(user, id);
  }
}
