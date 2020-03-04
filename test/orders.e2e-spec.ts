import { UserRepository } from '../src/auth/user.repository';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import { BidRepository } from '../src/bids/bid.repository';
import { deleteFromTables } from './utils/deleteFromTables';
import { createTokens, createLots, createUsers, createBids } from './utils/createData';
import { OrderRepository } from '../src/orders/order.repository';
import { ArrivalType } from '../src/orders/arrival-type.enum';

describe('OrdersController (e2e)', () => {
  let bidRepository: BidRepository;
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let orderRepository: OrderRepository;
  let accessToken1;
  let accessToken2;
  let accessToken3;
  let lotsExist;
  let client;
  let bidsExist;
  let orderExist;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    orderRepository = init.orderRepository;
    bidRepository = init.bidRepository;
    lotRepository = init.lotRepository;
    userRepository = init.authRepository;

    await createUsers(client, userRepository);
    accessToken1 = (await createTokens(client)).accessToken1;
    accessToken2 = (await createTokens(client)).accessToken2;
    accessToken3 = (await createTokens(client)).accessToken3;
    lotsExist = (await createLots(client, accessToken1, accessToken2, lotRepository)).lotsExist;
    bidsExist = (await createBids(client, accessToken1, accessToken2, lotsExist, bidRepository)).bidsExist;
  });

  afterAll(async () => {
    await deleteFromTables({ bid: bidRepository, lot: lotRepository, user: userRepository, order: orderRepository});
  });

  describe(`POST lots/id/order`, () => {
    it('should not create a bid for unauthorized user in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .expect(401);
    });

    it('should not create an order in lot1 with status not equals CLOSED', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ arrivalLocation: 'my adress', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(406)
        .expect(({ body }) => {
          expect(body.message).toEqual('can\'t create order for lot with status not equals CLOSED');
        });
    });

    it('should not create an order in lot1 for user1', async () => {
      await lotRepository.query(`UPDATE "lot" SET "status" = 'CLOSED'`);
      lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);

      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ arrivalLocation: 'my adress', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(500);
    });

    it('should not create an order in lot1 with status CLOSED for user2', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ arrivalLocation: 'my adress', arrivalType: 'not from ArrivalType' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isIn)
                .toEqual('arrivalType must be one of the following values: DHL_EXPRESS,ROYAL_MAIL,UNITED_STATES_POSTAL_SERVICE');
        });
    });

    it('should create an order in lot1 with status CLOSED for user2', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ arrivalLocation: 'my adress', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(201);

      orderExist = await orderRepository.query(`SELECT * FROM "order"`);
      expect(orderExist[0].bidId).toEqual(bidsExist[2].id);
      expect(orderExist[0].status).toEqual('PENDING');
    });

    it('should not create an order in lot1 if this order already exists', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ arrivalLocation: 'my adress1', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(500);
    });
  });

  describe(`PATCH lots/id/order`, () => {
    it('should not change order status for user1', async () => {
      await client
        .patch(`/lots/${lotsExist[0].id}/order/`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ arrivalLocation: '' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isNotEmpty).toEqual('arrivalLocation should not be empty');
        });
    });

    it('should not change order status for user1', async () => {
      await client
        .patch(`/lots/${lotsExist[0].id}/order/`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ arrivalLocation: 'my adress', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toEqual('Failed to get order by user test@test.com.');
        });
    });

    it('should not change order status for user2 if order status not in PENDING status', async () => {
      await orderRepository.query(`UPDATE "order" SET "status" = 'SENT'`);
      await client
        .patch(`/lots/${lotsExist[0].id}/order/`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ arrivalLocation: 'my adress', arrivalType: ArrivalType.DHL_EXPRESS })
        .expect(406)
        .expect(({ body }) => {
          expect(body.error).toEqual('Not Acceptable');
        });

      await orderRepository.query(`UPDATE "order" SET "status" = 'PENDING'`);
    });

    it('should change order status for user2', async () => {
      await client
        .patch(`/lots/${lotsExist[0].id}/order/`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ arrivalLocation: 'my adress new', arrivalType: ArrivalType.ROYAL_MAIL })
        .expect(200)
        .expect(({ body }) => {
          expect(body.arrivalLocation).toEqual('my adress new');
          expect(body.arrivalType).toEqual('ROYAL_MAIL');
        });
    });

  });

  describe(`PATCH lots/id/order/execute`, () => {
    it('should not change order status for user2', async () => {
      await client
        .patch(`/lots/${lotsExist[0].id}/order/execute`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(400);
    });

    it('should not change order status for user1 if order status not in PENDING status', async () => {
      await orderRepository.query(`UPDATE "order" SET "status" = 'SENT'`);
      await client
        .patch(`/lots/${lotsExist[0].id}/order/execute`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(400);
    });

    it('should change order status to SENT for user1', async () => {
      await orderRepository.query(`UPDATE "order" SET "status" = 'PENDING'`);
      await client
        .patch(`/lots/${lotsExist[0].id}/order/execute`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);
      orderExist = await orderRepository.query(`SELECT * FROM "order"`);
      expect(orderExist[0].status).toEqual('SENT');
    });
  });

  describe(`PATCH lots/id/order/receive`, () => {
    it('should throw error if lot.id is not exist', async () => {
      await client
        .patch(`/lots/123456/order/receive`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(500);
    });

    it('should not change order status for user1', async () => {
      await client
        .patch(`/lots/${lotsExist[0].id}/order/receive`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(400);
    });

    it('should not change order status for user2 if order status not in SENT status', async () => {
      await orderRepository.query(`UPDATE "order" SET "status" = 'PENDING'`);
      await client
        .patch(`/lots/${lotsExist[0].id}/order/receive`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(400);
    });

    it('should change order status to DELIVERED for user2', async () => {
      await orderRepository.query(`UPDATE "order" SET "status" = 'SENT'`);
      await client
        .patch(`/lots/${lotsExist[0].id}/order/receive`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);
      orderExist = await orderRepository.query(`SELECT * FROM "order"`);
      expect(orderExist[0].status).toEqual('DELIVERED');
    });
  });

  describe(`GET lots/id/order`, () => {

    it('should return order for user2', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toEqual('DELIVERED');
          expect(body.bidId).toEqual(bidsExist[2].id);
        });
    });

    it('should return order for user1', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toEqual('DELIVERED');
          expect(body.bidId).toEqual(bidsExist[2].id);
        });
    });

    it('should not return order for user3', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/order`)
        .set('Authorization', `Bearer ${accessToken3}`)
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toEqual('Failed to get order by user test8@email.com.');
        });
    });

  });
});
