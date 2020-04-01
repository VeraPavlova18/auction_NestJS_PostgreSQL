import { Process, Processor } from '@nestjs/bull';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { Job } from 'bull';
import { LotStatus } from 'src/lots/lot-status.enum';

@Processor('bids')
export class BidsProcessor {
  constructor(
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
  ) { this.myLogger.setContext(BidsProcessor.name); }

  @Process('isTheLotPayed')
  async isTheLotPayed(job: Job<any>) {
    const { lotId } = job.data;
    const lot = await this.dbqueries.getLot(lotId);
    if (lot.isPayment === true) {
      this.myLogger.debug(`Lot with id: ${lotId} is paid`);
    } else {
      this.myLogger.debug(`Lot with id: ${lotId} is not paid`);
      const owner = await this.dbqueries.getLotOwner(lot);
      const maxBid = await this.dbqueries.getMaxBidPrice(lotId);
      const ownerOfMaxBid = await this.dbqueries.getOwnerOfMaxBidOfLot(maxBid);

      await this.dbqueries.deleteBids(lotId);
      this.myLogger.debug(`All bids for lot with id: ${lotId} is delete`);

      await this.dbqueries.changeLotsStatus(LotStatus.PENDING, `id = :id AND status = 'CLOSED'`, { id: lotId });
      this.myLogger.debug(`Lot with id: ${lotId} is pending`);

      await this.dbqueries.banUser(`id = :id`, { id: ownerOfMaxBid.id });
      this.myLogger.debug(`ban user ${ownerOfMaxBid.email}`);

      this.sendEmailService.sendEmailToTheBidsWinnerAfterLotIsNotPaid(
        ownerOfMaxBid.email,
        ownerOfMaxBid.firstName,
        lot.title,
      );

      this.sendEmailService.sendEmailToTheLotOwnerAfterAfterLotIsNotPaid(
        owner.email,
        owner.firstName,
        lot.title,
      );
    }
  }
}
