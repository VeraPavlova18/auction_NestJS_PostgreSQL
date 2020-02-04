import { Controller, UseGuards, Logger, Post, UsePipes, ValidationPipe, Body, ParseIntPipe, Param, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { User } from 'src/auth/user.entity';
import { GetUser } from 'src/auth/get-user.decorator';
import { Bid } from './bid.entity';
import { BidCustomer } from './bidCustomer.interface';

@Controller('lots/:id/bids')
@UseGuards(AuthGuard('jwt'))
export class BidsController {
  private logger = new Logger('BidsController');
  constructor(private bidsService: BidsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  createBid(
    @GetUser() user: User,
    @Body() createBidDto: CreateBidDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BidCustomer> {
    return this.bidsService.createBid(user, createBidDto, id);
  }

  @Get()
  getBidsByLotId(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Bid[]> {
    return this.bidsService.getBidsByLotId(user, id);
  }

}
