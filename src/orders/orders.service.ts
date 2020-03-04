import { Injectable, BadRequestException, NotAcceptableException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../auth/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRepository } from './order.repository';
import { SendEmailService } from '../mail/sendEmailService';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderRepository)
    private orderRepository: OrderRepository,
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
  ) {
    this.myLogger.setContext('OrdersService');
  }

  async createOrder(user: User, createOrderDto: CreateOrderDto, id: number): Promise<Order> {
    const lot = await this.dbqueries.getLot(id);

    if (lot.status !== 'CLOSED') {
      this.myLogger.verbose(`User "${user.email}" can't create order for lot with status not equals CLOSED.`);
      throw new NotAcceptableException('can\'t create order for lot with status not equals CLOSED');
    }

    const owner = await this.dbqueries.getLotOwner(lot);
    const order = await this.orderRepository.createOrder(user, createOrderDto, id);

    this.sendEmailService.sendOrderToTheLotOwner(
      owner.email,
      owner.firstName,
      lot.title,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
    );
    return order;
  }

  async getOrderByLotId(user: User, id: number) {
    const lot = await this.dbqueries.getLot(id);
    const owner = await this.dbqueries.getLotOwner(lot);
    const maxPrice = await this.orderRepository.getMaxBidPrice(id);
    const maxBid = await this.orderRepository.getmaxBidOfLot(maxPrice);

    if (user.id !== owner.id && user.id !== maxBid.userId) {
      throw new BadRequestException({ status: 400, error: `Failed to get order by user ${user.email}.` });
    }
    return await this.orderRepository.getOrderByLotId(id);
  }

  async updateOrder(id: number, updateOrderDto: UpdateOrderDto, user: User) {
    const maxPrice = await this.orderRepository.getMaxBidPrice(id);
    const maxBid = await this.orderRepository.getmaxBidOfLot(maxPrice);
    if (user.id !== maxBid.userId) {
      throw new BadRequestException({ status: 400, error: `Failed to get order by user ${user.email}.` });
    }
    return await this.orderRepository.updateOrder(id, updateOrderDto, user);
  }

  async changeOrderStatusByOwner(user: User, orderStatus: OrderStatus, id: number): Promise<void> {
    const lot = await this.dbqueries.getLot(id);
    const order = await this.orderRepository.getOrderByLotId(id);

    if (order.status !== 'PENDING') {
      this.myLogger.error(`Failed to change order status by user ${user.email}. Order status must to be in "PENDING"`);
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Order status must to be in "PENDING"`,
      });
    }

    const owner = await this.dbqueries.getLotOwner(lot);

    if (user.id !== owner.id) {
      this.myLogger.error(`Failed to change order status by user ${user.email}. Only lot owner can change order status for SENT`);
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}.  Only lot owner can change order status for SENT`,
      });
    }

    await this.orderRepository.changeOrderStatus(orderStatus, id);

    const maxPrice = await this.orderRepository.getMaxBidPrice(id);
    const customer = await this.orderRepository.getLotCustomer(maxPrice);

    this.sendEmailService.sendChangeStatusOfOrderToTheLotCustomer(
      customer.email,
      customer.firstName,
      lot.title,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
    );
  }

  async changeOrderStatusByCustomer(user: User, orderStatus: OrderStatus, id: number): Promise<void> {
    const maxPrice = await this.orderRepository.getMaxBidPrice(id);
    const maxBid = await this.orderRepository.getmaxBidOfLot(maxPrice);
    const order = await this.orderRepository.getOrderByLotId(id);
    const lot = await this.dbqueries.getLot(id);
    const owner = await this.dbqueries.getLotOwner(lot);
    const customer = await this.orderRepository.getLotCustomer(maxPrice);

    if (order.status !== 'SENT') {
      this.myLogger.error(`Failed to change order status by user ${user.email}. Order status must to be in "SENT"`);
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Order status must to be in "SENT"`,
      });
    }

    if (user.id !== maxBid.userId) {
      this.myLogger.error(`Failed to change order status by user ${user.email}. Only lot customer can change order status for DELIVERED`);
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Only lot customer can change order status for DELIVERED`,
      });
    }

    await this.orderRepository.changeOrderStatus(orderStatus, id);

    this.sendEmailService.sendDeliveredEmailToTheLotOwner(
      owner.email,
      owner.firstName,
      lot.title,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
    );
    this.sendEmailService.sendDeliveredEmailToTheLotCustomer(
      customer.email,
      customer.firstName,
      lot.title,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
    );
  }
}
