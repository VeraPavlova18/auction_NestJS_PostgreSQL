import { EntityRepository, Repository, getConnection } from 'typeorm';
import {
  Logger,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../auth/user.entity';
import { OrderStatus } from './order-status.enum';
import { Bid } from '../bids/bid.entity';
import { Lot } from '../lots/lot.entity';

@EntityRepository(Order)
export class OrderRepository extends Repository<Order> {
  private logger = new Logger('OrderRepository');

  async getMaxBidNumber(id: number): Promise<object> {
    return getConnection()
      .createQueryBuilder()
      .select('Max(bid.proposedPrice)', 'max')
      .from(Bid, 'bid')
      .where('bid.lotId = :lotId', { lotId: id })
      .getRawOne();
  }

  async getMaxBidOfLot(id: number): Promise<object> {
    const max = await this.getMaxBidNumber(id);
    return getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.proposedPrice = :max', Object(max))
      .getOne();
  }

  async getLot(id: number): Promise<Lot> {
    return getConnection()
      .createQueryBuilder()
      .select('lot')
      .from(Lot, 'lot')
      .where('lot.id = :id', { id })
      .getOne();
  }

  async getBid(id: number): Promise<Bid> {
    return getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.lotId = :id', { id })
      .getOne();
  }

  async getLotOwner(lot: Lot): Promise<User> {
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: lot.userId })
      .getOne();
  }

  async getLotCustomer(max: object): Promise<User> {
    const maxBid = await getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.proposedPrice = :max', Object(max))
      .getOne();

    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: maxBid.userId })
      .getOne();
  }

  async createOrder(
    user: User,
    createOrderDto: CreateOrderDto,
    id: number,
  ): Promise<Order> {
    const lot = await this.getLot(id);
    if (lot.status !== 'CLOSED') {
      this.logger.verbose(
        `User "${user.email}" can't create order for lot with status not equals CLOSED.`,
      );
      throw new NotAcceptableException(
        'can\'t create order for lot with status not equals CLOSED',
      );
    }
    const isOrderExist = await this.getOrderByLotId(id);
    if (isOrderExist) {
      throw new InternalServerErrorException();
    }
    const maxBid = await this.getMaxBidOfLot(id);
    if (!maxBid) {
      throw new InternalServerErrorException();
    }
    const max = await this.getMaxBidNumber(id);
    const customer = await this.getLotCustomer(Object(max));
    if (user.id !== customer.id) {
      throw new InternalServerErrorException();
    }
    const { arrivalLocation, arrivalType } = createOrderDto;
    const order = new Order();
    order.arrivalLocation = arrivalLocation;
    order.arrivalType = arrivalType;
    order.status = OrderStatus.PENDING;
    order.bidId = Object(maxBid).id;
    try {
      await order.save();
    } catch (error) {
      this.logger.error(
        `Failed to create an order for user ${user.email}. Data: ${createOrderDto}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    return order;
  }

  async getOrderByLotId(id: number) {
    const maxBid = await this.getMaxBidOfLot(id);
    return getConnection()
      .createQueryBuilder()
      .select('order')
      .from(Order, 'order')
      .where('order.bidId = :id', { id: Object(maxBid).id })
      .getOne();
  }

  async changeOrderStatus(
    user: User,
    orderStatus: OrderStatus,
    id: number,
  ): Promise<void> {
    const order = await this.getOrderByLotId(id);
    await getConnection()
      .createQueryBuilder()
      .update(Order)
      .set({ status: orderStatus })
      .where(`id = :id`, { id: order.id })
      .execute();
  }

  async updateOrder(
    id: number,
    createOrderDto: CreateOrderDto,
    user: User,
  ): Promise<Order> {
    const order = await this.getOrderByLotId(id);
    if (order.status !== 'PENDING') {
      this.logger.verbose(
        `User "${user.email}" can't change order with status not equals pending.`,
      );
      throw new NotAcceptableException(
        'can\'t change lot with status not equals pending.',
      );
    }
    const { arrivalLocation, arrivalType } = createOrderDto;

    order.arrivalLocation = arrivalLocation ?? order.arrivalLocation;
    order.arrivalType = arrivalType ?? order.arrivalType;

    await order.save();
    return order;
  }
}
