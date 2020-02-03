import { Bid } from './bid.entity';

export interface BidCustomer extends Bid {

  customer: string;

}
