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
          expect(body.message[0].constraints.isIn).toEqual('arrivalType must be one of the following values: DHL_EXPRESS,ROYAL_MAIL,UNITED_STATES_POSTAL_SERVICE');
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
});
