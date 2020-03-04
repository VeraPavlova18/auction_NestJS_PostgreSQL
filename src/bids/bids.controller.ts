import {
  Controller,
  UseGuards,
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
import { MyLogger } from '../logger/my-logger.service';

@Controller('lots/:id/bids')
@UseGuards(AuthGuard('jwt'))
export class BidsController {

  constructor(
    private bidsService: BidsService,
    private readonly myLogger: MyLogger,
  ) {
    this.myLogger.setContext('BidsController');
  }

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
    this.myLogger.debug(`user: ${user.email} get all bids for lot with id: ${id}`);
    return this.bidsService.getBidsByLotId(user, id);
  }
}
