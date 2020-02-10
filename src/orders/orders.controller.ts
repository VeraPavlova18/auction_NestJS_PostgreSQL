import {
  Controller,
  UseGuards,
  Logger,
  Post,
  Get,
  UsePipes,
  ValidationPipe,
  Body,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/auth/user.entity';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';

@Controller('lots/:id/order')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  private logger = new Logger('OrdersController');
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UsePipes(ValidationPipe)
  createBid(
    @GetUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.createOrder(user, createOrderDto, id);
  }

  @Patch('/execute')
  changeOrderStatusByOwner(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.ordersService.changeOrderStatusByOwner(
      user,
      OrderStatus.SENT,
      id,
    );
  }

  @Patch('/receive')
  changeOrderStatusByCustomer(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.ordersService.changeOrderStatusByCustomer(
      user,
      OrderStatus.DELIVERED,
      id,
    );
  }

  @Get()
  getOrderByLotId(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.getOrderByLotId(user, id);
  }

  @Patch()
  @UsePipes(ValidationPipe)
  updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.updateOrder(id, createOrderDto, user);
  }
}
