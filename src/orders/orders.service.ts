import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../auth/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRepository } from './order.repository';
import { SendEmailService } from '../mail/sendEmailService';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';

@Injectable()
export class OrdersService {
  private logger = new Logger('BidsService');

  constructor(
    @InjectRepository(OrderRepository)
    private orderRepository: OrderRepository,
    private sendEmailService: SendEmailService,
  ) {}

  async createOrder(
    user: User,
    createOrderDto: CreateOrderDto,
    id: number,
  ): Promise<Order> {
    return this.orderRepository
      .createOrder(user, createOrderDto, id)
      .then(async order => {
        const lot = await this.orderRepository.getLot(id);
        const owner = await this.orderRepository.getLotOwner(lot);
        this.sendEmailService.sendOrderToTheLotOwner(
          owner.email,
          owner.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
        return order;
      });
  }

  async getOrderByLotId(user: User, id: number) {
    const lot = await this.orderRepository.getLot(id);
    const owner = await this.orderRepository.getLotOwner(lot);
    const bid = await this.orderRepository.getBid(id);
    if (user.id !== owner.id || user.id !== bid.userId) {
      throw new BadRequestException({
        status: 400,
        error: `Failed to get order by user ${user.email}.`,
      });
    }
    return this.orderRepository.getOrderByLotId(id);
  }

  async updateOrder(id: number, createOrderDto: CreateOrderDto, user: User) {
    const bid = await this.orderRepository.getBid(id);
    if (user.id !== bid.userId) {
      throw new BadRequestException({
        status: 400,
        error: `Failed to get order by user ${user.email}.`,
      });
    }
    return this.orderRepository.updateOrder(id, createOrderDto, user);
  }

  async changeOrderStatusByOwner(
    user: User,
    orderStatus: OrderStatus,
    id: number,
  ): Promise<void> {
    const lot = await this.orderRepository.getLot(id);
    const owner = await this.orderRepository.getLotOwner(lot);
    const order = await this.orderRepository.getOrderByLotId(id);
    if (order.status !== 'PENDING') {
      this.logger.error(
        `Failed to change order status by user ${user.email}. Order status must to be in "PENDING"`,
      );
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Order status must to be in "PENDING"`,
      });
    }
    if (user.id !== owner.id) {
      this.logger.error(
        `Failed to change order status by user ${user.email}. Only lot owner can change order status for SENT`,
      );
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}.  Only lot owner can change order status for SENT`,
      });
    }
    return this.orderRepository
      .changeOrderStatus(user, orderStatus, id)
      .then(async () => {
        const max = await this.orderRepository.getMaxBidNumber(id);
        const customer = await this.orderRepository.getLotCustomer(Object(max));
        this.sendEmailService.sendChangeStatusOfOrderToTheLotCustomer(
          customer.email,
          customer.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
      });
  }

  async changeOrderStatusByCustomer(
    user: User,
    orderStatus: OrderStatus,
    id: number,
  ): Promise<void> {
    const bid = await this.orderRepository.getBid(id);
    const order = await this.orderRepository.getOrderByLotId(id);
    if (order.status !== 'SENT') {
      this.logger.error(
        `Failed to change order status by user ${user.email}. Order status must to be in "SENT"`,
      );
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Order status must to be in "SENT"`,
      });
    }
    if (user.id !== bid.userId) {
      this.logger.error(
        `Failed to change order status by user ${user.email}. Only lot customer can change order status for DELIVERED`,
      );
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}. Only lot customer can change order status for DELIVERED`,
      });
    }
    return this.orderRepository
      .changeOrderStatus(user, orderStatus, id)
      .then(async () => {
        const lot = await this.orderRepository.getLot(id);
        const owner = await this.orderRepository.getLotOwner(lot);
        this.sendEmailService.sendDeliveredEmailToTheLotOwner(
          owner.email,
          owner.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
      })
      .then(async () => {
        const lot = await this.orderRepository.getLot(id);
        const max = await this.orderRepository.getMaxBidNumber(id);
        const customer = await this.orderRepository.getLotCustomer(Object(max));
        this.sendEmailService.sendDeliveredEmailToTheLotCustomer(
          customer.email,
          customer.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
      });
  }
}
