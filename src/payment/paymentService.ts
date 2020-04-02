import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';
import { MyLogger } from 'src/logger/my-logger.service';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-03-02' });

@Injectable()
export class PaymentService {
  constructor( private readonly myLogger: MyLogger ) {
    this.myLogger.setContext('PaymentService');
  }

  async isPaymentSucces(pi: any): Promise<boolean> {
    try {
      await stripe.paymentIntents.retrieve(pi.pi);
      return true;
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async paymentIntent(price, user): Promise<any> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.customerId,
        type: 'card',
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: 'usd',
        customer: user.customerId,
        receipt_email: 'pavlova.vera18@gmail.com',
        metadata: {
          integration_check: 'accept_a_payment',
        },
      });
      return paymentIntent;
    } catch (err) {
      this.myLogger.verbose(`Error code is: ${err.code}`);
      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
      this.myLogger.verbose(`PI retrieved: ${paymentIntentRetrieved.id}`);
    }
  }
}
