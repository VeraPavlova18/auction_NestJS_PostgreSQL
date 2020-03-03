import { EntityRepository, Repository, getConnection } from 'typeorm';
import { Logger, InternalServerErrorException, NotAcceptableException } from '@nestjs/common';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../auth/user.entity';
import { OrderStatus } from './order-status.enum';
import { Bid } from '../bids/bid.entity';

@EntityRepository(Order)
export class OrderRepository extends Repository<Order> {
  private logger = new Logger('OrderRepository');

  async getMaxBidPrice(id: number): Promise<number> {
    const maxObj = await getConnection()
      .createQueryBuilder()
      .select('Max(bid.proposedPrice)', 'max')
      .from(Bid, 'bid')
      .where('bid.lotId = :lotId', { lotId: id })
      .getRawOne();
    return maxObj.max;
  }

  async getmaxBidOfLot(maxPrice: number): Promise<Bid> {
    return getConnection()
      .createQueryBuilder()
      .select('bid')
      .from(Bid, 'bid')
      .where('bid.proposedPrice = :max', { max: maxPrice })
      .getOne();
  }

  async getLotCustomer(maxPrice: number): Promise<User> {
    const maxBid = await this.getmaxBidOfLot(maxPrice);
    return getConnection()
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id: maxBid.userId })
      .getOne();
  }

  async getOrderByLotId(id: number) {
    const maxPrice = await this.getMaxBidPrice(id);
    const maxBid = await this.getmaxBidOfLot(maxPrice);
    return getConnection()
      .createQueryBuilder()
      .select('order')
      .from(Order, 'order')
      .where('order.bidId = :id', { id: Object(maxBid).id })
      .getOne();
  }

  async createOrder(user: User, createOrderDto: CreateOrderDto, id: number): Promise<Order> {
    const isOrderExist = await this.getOrderByLotId(id);
    const maxPrice = await this.getMaxBidPrice(id);
    const maxBid = await this.getmaxBidOfLot(maxPrice);
    const customer = await this.getLotCustomer(maxPrice);

    if (isOrderExist) { throw new InternalServerErrorException(`Order for lot with id: ${id} already exist!`); }

    if (!maxBid) { throw new InternalServerErrorException(`Lot with id: ${id} has no bids`); }

    if (user.id !== customer.id) { throw new InternalServerErrorException(`User with id: ${user.id} not a winner of this lot`); }

    const { arrivalLocation, arrivalType } = createOrderDto;
    const order = new Order();
    order.arrivalLocation = arrivalLocation;
    order.arrivalType = arrivalType;
    order.status = OrderStatus.PENDING;
    order.bidId = maxBid.id;

    try {
      await order.save();
    } catch (error) {
      this.logger.error(`Failed to create an order for user ${user.email}. Data: ${createOrderDto}`, error.stack);
      throw new InternalServerErrorException();
    }
    return order;
  }

  async changeOrderStatus(user: User,  orderStatus: OrderStatus,  id: number): Promise<void> {
    const order = await this.getOrderByLotId(id);
    await getConnection()
      .createQueryBuilder()
      .update(Order)
      .set({ status: orderStatus })
      .where(`id = :id`, { id: order.id })
      .execute();
  }

  async updateOrder(id: number, createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    const order = await this.getOrderByLotId(id);

    if (order.status !== 'PENDING') {
      this.logger.verbose(`User "${user.email}" can't change order with status not equals pending.`);
      throw new NotAcceptableException('can\'t change lot with status not equals pending.');
    }

    const { arrivalLocation, arrivalType } = createOrderDto;
    order.arrivalLocation = arrivalLocation ?? order.arrivalLocation;
    order.arrivalType = arrivalType ?? order.arrivalType;

    try {
      await order.save();
    } catch (error) {
      this.logger.error(`Failed to update an order for user ${user.email}. Data: ${createOrderDto}`, error.stack);
      throw new InternalServerErrorException();
    }
    return order;
  }
}
