import { Process, Processor } from '@nestjs/bull';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { LotStatus } from './lot-status.enum';
import { Job } from 'bull';
import { LotsService } from './lots.service';

@Processor('lots')
export class LotsProcessor {
  constructor(
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
    private lotsService: LotsService,
  ) { this.myLogger.setContext(LotsProcessor.name); }

  @Process('startLot')
  async startLot(job: Job<any>) {
    const { lotId } = job.data;
    await this.dbqueries.changeLotsStatus(LotStatus.IN_PROCESS, `id = :id AND status = 'PENDING'`, { id: lotId });
    this.myLogger.debug(`Start lot with id: ${lotId}`);
  }

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

  @Process('closeLot')
  async closeLot(job: Job<any>) {
    const { lotId } = job.data;
    await this.dbqueries.changeLotsStatus(LotStatus.CLOSED, `id = :id AND status != 'CLOSED'`, { id: lotId });
    this.myLogger.debug(`End lot with id: ${lotId}`);

    const lot = await this.dbqueries.getLot(lotId);
    const owner = await this.dbqueries.getLotOwner(lot);
    const maxBid = await this.dbqueries.getMaxBidPrice(lotId);

    if (maxBid) {
      const ownerOfMaxBid = await this.dbqueries.getOwnerOfMaxBidOfLot(maxBid);
      this.sendEmailService.sendEmailToTheBidsWinner(
        ownerOfMaxBid.email,
        ownerOfMaxBid.firstName,
        lot.title,
        maxBid,
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/lots/${lotId}/payment`,
      );
      this.lotsService.addPaymentsJobs(lot);
    }

    this.sendEmailService.sendEmailToTheLotOwner(
      owner.email,
      owner.firstName,
      lot.title,
      maxBid || lot.curentPrice,
      `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
    );
  }
}
