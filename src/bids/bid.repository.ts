import { EntityRepository, Repository, getManager } from 'typeorm';
import { User } from '../auth/user.entity';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Bid } from './bid.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import * as moment from 'moment';
import { Lot } from '../lots/lot.entity';
import { LotStatus } from '../lots/lot-status.enum';

@EntityRepository(Bid)
export class BidRepository extends Repository<Bid> {

  async createBid(user: User, createBidDto: CreateBidDto, id: number): Promise<Bid> {
    const { proposedPrice } = createBidDto;
    try {
      return getManager().transaction(
        'SERIALIZABLE',
        async transactionalEntityManager => {
          await transactionalEntityManager.query('LOCK TABLE bid IN ACCESS EXCLUSIVE MODE;');
          const { max } = await transactionalEntityManager
            .createQueryBuilder(Bid, 'bid')
            .select('Max(bid.proposedPrice)', 'max')
            .where('bid.lotId = :lotId', { lotId: id })
            .getRawOne();
          const lot = await transactionalEntityManager.findOne(Lot, id);

          if (lot.status !== LotStatus.IN_PROCESS) {
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
          bid.userId = user.id;
          bid.lotId = id;
          await transactionalEntityManager.save(bid);
          bid.setLoggedUserId(user.id);
          bid.setCustomer();
          return bid;
        },
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getBids(user: User, id: number): Promise<Bid[]> {
    const query = this.createQueryBuilder('bid');
    try {
      const bids = await query
        .where('bid.lotId = :lotId', { lotId: id })
        .orderBy('bid.creationTime', 'DESC')
        .getMany();
      return bids.map(bid => {
        bid.setLoggedUserId(user.id);
        return bid;
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
