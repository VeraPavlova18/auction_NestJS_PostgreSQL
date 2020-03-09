import { Process, Processor } from '@nestjs/bull';
import { SendEmailService } from '../mail/sendEmailService';
import { DBqueries } from '../db.queries';
import { MyLogger } from '../logger/my-logger.service';
import { LotStatus } from './lot-status.enum';
import { Job } from 'bull';

@Processor('lots')
export class LotsProcessor {
  constructor(
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
  ) { this.myLogger.setContext(LotsProcessor.name); }

  @Process('startLot')
  async startLot(job: Job<any>) {
    const { lotId } = job.data;
    await this.dbqueries.changeLotsStatus(LotStatus.IN_PROCESS, `lot.id = :id AND status = 'PENDING'`, { id: lotId });
    this.myLogger.debug(`Start lot with id: ${lotId}`);
  }

  @Process('closeLot')
  async closeLot(job: Job<any>) {
    const { lotId } = job.data;
    await this.dbqueries.changeLotsStatus(LotStatus.CLOSED, `lot.id = :id AND status != 'CLOSED'`, { id: lotId });
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
        `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`,
      );
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
