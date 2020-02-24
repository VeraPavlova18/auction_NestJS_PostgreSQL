import {
  EntityRepository,
  Repository,
  getManager,
} from 'typeorm';
import { User } from '../auth/user.entity';
import {
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import * as moment from 'moment';
import { BidCustomer } from './bidCustomer.interface';
import { Lot } from '../lots/lot.entity';
import { LotStatus } from '../lots/lot-status.enum';

@EntityRepository(Bid)
export class BidRepository extends Repository<Bid> {
  private logger = new Logger('BidRepository');

  customizeBid(bid: Bid, user: User): BidCustomer {
    const customer =
      bid.userId === user.id
        ? `You`
        : `Customer ${Math.floor(Math.random() * 100000 + 1)}`;
    delete bid.user;
    delete bid.userId;
    return { ...bid, customer } as BidCustomer;
  }

  async createBid(
    user: User,
    createBidDto: CreateBidDto,
    id: number,
  ): Promise<BidCustomer> {
    const { proposedPrice } = createBidDto;
    try {
      return getManager().transaction(
        'SERIALIZABLE',
        async transactionalEntityManager => {
          await transactionalEntityManager.query(
            'LOCK TABLE bid IN ACCESS EXCLUSIVE MODE;',
          );
          const { max } = await transactionalEntityManager
            .createQueryBuilder(Bid, 'bid')
            .select('Max(bid.proposedPrice)', 'max')
            .where('bid.lotId = :lotId', { lotId: id })
            .getRawOne();
          const lot = await transactionalEntityManager.findOne(Lot, id);
          if (lot.status !== LotStatus.IN_PROCESS) {
            this.logger.error(
              `Failed to create a bid for lot ${lot.title}(id: ${lot.id}) by user ${user.email}.`,
            );
            throw new BadRequestException({
              status: 400,
              error: `Failed to create a bid for lot ${lot.title}(id: ${lot.id}) by user ${user.email}.`,
            });
          }
          const { estimatedPrice, curentPrice } = lot;

          if (proposedPrice < curentPrice || proposedPrice > estimatedPrice) {
            throw new BadRequestException({
              status: 400,
              error: `proposedPrice: ${proposedPrice} must be equal or greater then lot curentPrice: ${curentPrice} and less or equal then estimatedPrice: ${estimatedPrice}`,
            });
          }
          if (+proposedPrice <= max || +proposedPrice > estimatedPrice) {
            throw new BadRequestException({
              status: 400,
              error: `proposedPrice: ${proposedPrice} must be greater then previous bid: ${max} and less or equal then estimatedPrice: ${estimatedPrice}`,
            });
          }
          if (+proposedPrice === estimatedPrice) {
            lot.status = LotStatus.CLOSED;
            await transactionalEntityManager.save(lot);
          }
          const bid = new Bid();
          bid.proposedPrice = proposedPrice;
          bid.creationTime = moment().toDate();
          bid.user = user;
          bid.lotId = id;
          await transactionalEntityManager.save(bid);
          return this.customizeBid(bid, user);
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to create a Bid for user ${user.email}. Data: ${createBidDto}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getBids(user: User, id: number): Promise<BidCustomer[]> {
    const query = this.createQueryBuilder('bid');
    try {
      const bids = await query
        .where('bid.lotId = :lotId', { lotId: id })
        .orderBy('bid.creationTime', 'DESC')
        .getMany();
      return bids.map(bid => this.customizeBid(bid, user));
    } catch (error) {
      this.logger.error(
        `Failed to get bids for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
