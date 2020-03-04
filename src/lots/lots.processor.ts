import { Process, Processor } from '@nestjs/bull';
import { SendEmailService } from 'src/mail/sendEmailService';
import { DBqueries } from 'src/db.queries';
import { MyLogger } from 'src/logger/my-logger.service';
import { LotStatus } from './lot-status.enum';

@Processor('lots')
export class LotsProcessor {
  constructor(
    private sendEmailService: SendEmailService,
    private dbqueries: DBqueries,
    private readonly myLogger: MyLogger,
  ) { this.myLogger.setContext(LotsProcessor.name); }

  @Process()
  async handleChangeStatus() {
    const lotsInProcess = await this.dbqueries.getLotsWhere(`"startTime" <= now() AND "endTime" > now() AND status = 'PENDING'`);
    await Promise.all(lotsInProcess.map(lot => this.dbqueries.changeLotsStatus(LotStatus.IN_PROCESS, `lot.id = :id`, { id: lot.id })));

    const lotsClosed = await this.dbqueries.getLotsWhere(`"endTime" <= now() AND status != 'CLOSED'`);
    await Promise.all(lotsClosed.map(lot => this.dbqueries.changeLotsStatus(LotStatus.CLOSED, `lot.id = :id`, { id: lot.id })));

    if (lotsClosed.length > 0) {
      lotsClosed.map(async lot => {
        const owner = await this.dbqueries.getLotOwner(lot);
        const maxBid = await this.dbqueries.getMaxBidPrice(lot.id);

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
      });
    }
  }
}
