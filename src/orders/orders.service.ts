import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/auth/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRepository } from './order.repository';
import { SendEmailService } from 'src/mail/sendEmailService';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';

@Injectable()
export class OrdersService {private logger = new Logger('BidsService');

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
    return this.orderRepository.createOrder(user, createOrderDto, id)
      .then(async order => {
        const lot = await this.orderRepository.getLot(id);
        const owner = await this.orderRepository.getLotOwner(lot);
        this.sendEmailService.sendOrderToTheLotOwner(
          'pavlova.vera18@gmail.com', // DONT FORGET!!! change email owner.email!!!
          owner.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
        return order;
      });
  }

  async changeOrderStatusByOwner(
    user: User,
    orderStatus: OrderStatus,
    id: number,
  ): Promise<void> {
    const lot = await this.orderRepository.getLot(id);
    const owner = await this.orderRepository.getLotOwner(lot);
    if (user.id !== owner.id) {
      this.logger.error(
        `Failed to change order status by user ${user.email}. Only lot owner can change order status for SENT`,
      );
      throw new BadRequestException({
        status: 400,
        error: `Failed to change order status by user ${user.email}.  Only lot owner can change order status for SENT`,
      });
    }
    return this.orderRepository.changeOrderStatus(user, orderStatus, id)
      .then(async () => {
        const max = await this.orderRepository.getMaxBidNumber(id);
        const customer = await this.orderRepository.getLotCustomer(Object(max));
        this.sendEmailService.sendChangeStatusOfOrderToTheLotCustomer(
          'pavlova.vera18@gmail.com', // DONT FORGET!!! change email owner.email!!!
          customer.firstName,
          lot.title,
          `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
        );
    });
  }

  // async changeOrderStatusByCustomer(
  //   user: User,
  //   orderStatus: OrderStatus,
  //   id: number,
  // ): Promise<void> {
  //   const bid = await this.orderRepository.getBid(id);
  //   if (user.id !== bid.userId) {
  //     this.logger.error(
  //       `Failed to change order status by user ${user.email}. Only lot owner can change order status for `,
  //     );
  //     throw new BadRequestException({
  //       status: 400,
  //       error: `Failed to change order status by user ${user.email}.`,
  //     });
  //   }
  //   return this.orderRepository.changeOrderStatus(user, orderStatus, id);
  // }

  // async getOrderByLotId(user: User, id: number): Promise<Order> {
  //   return this.orderRepository.getOrder(user, id);
  // }
}
