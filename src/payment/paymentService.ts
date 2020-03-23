import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-03-02' });

@Injectable()
export class PaymentService {

  async paymentIntent(price, user): Promise<any> {
    // const paymentMethods = await stripe.paymentMethods.list({
    //   customer: user.customerId,
    //   type: 'card',
    // });
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: 'usd',
        customer: user.customerId,
        // payment_method: paymentMethods.data[0].id,
        // off_session: true,
        // confirm: true,
        // return_url: `http://localhost:3000/lots/${id}/payment/success`,
        metadata: {
          integration_check: 'accept_a_payment',
        },
      });
      return paymentIntent;
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.log('Error code is: ', err.code);
      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
      // tslint:disable-next-line:no-console
      console.log('PI retrieved: ', paymentIntentRetrieved.id);
    }
  }
}
