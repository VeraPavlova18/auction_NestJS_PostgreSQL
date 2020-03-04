import {
  Controller,
  UseGuards,
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
import { GetUser } from '../auth/get-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../auth/user.entity';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('lots/:id/order')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
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
    return this.ordersService.changeOrderStatusByOwner(user, OrderStatus.SENT, id);
  }

  @Patch('/receive')
  changeOrderStatusByCustomer(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.ordersService.changeOrderStatusByCustomer(user, OrderStatus.DELIVERED, id);
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
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser() user: User,
  ): Promise<Order> {
    return this.ordersService.updateOrder(id, updateOrderDto, user);
  }
}
