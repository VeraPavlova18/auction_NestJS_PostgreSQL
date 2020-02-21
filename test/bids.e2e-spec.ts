import { UserRepository } from '../src/auth/user.repository';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import { BidRepository } from '../src/bids/bid.repository';
import { deleteFromTables } from './utils/deleteFromTables';
import { createTokens, createLots, createUsers } from './utils/createUsers';

describe('LotsController (e2e)', () => {
  let bidRepository: BidRepository;
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let accessToken1;
  let accessToken2;
  let lotsExist;
  let client;
  let bidsExist;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    bidRepository = init.bidRepository;
    lotRepository = init.lotRepository;
    userRepository = init.authRepository;

    await createUsers(client, userRepository);
    accessToken1 = (await createTokens(client)).accessToken1;
    accessToken2 = (await createTokens(client)).accessToken2;
    lotsExist = (await createLots(client, accessToken1, accessToken2, lotRepository)).lotsExist;
  });

  afterAll(async () => {
    await deleteFromTables({bid: bidRepository, lot: lotRepository, user: userRepository});
  });

  describe(`POST /lots/id/bids`, () => {
    it('should not create a bid for unauthorized user in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .send({proposedPrice: 10})
        .expect(401);
    });

    it('should not create a bid with proposedPrice < lot.curentPrice', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: 2 })
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toEqual('proposedPrice: 2 must be equal or greater then lot curentPrice: 5 and less or equal then estimatedPrice: 555');
        });
    });

    it('should not create a bid with proposedPrice < 0', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: -50 })
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toEqual('Bad Request');
        });
    });

    it('should create a bid in the lot1 for authorization user1 in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: 25 })
        .expect(201);

      bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
      expect(bidsExist[0].lotId).toEqual(lotsExist[0].id);
      expect(bidsExist[0].proposedPrice).toEqual(25);
    });

    it('should not create a bid with same proposedPrice', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: 25 })
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toEqual('proposedPrice: 25 must be greater then previous bid: 25 and less or equal then estimatedPrice: 555');
        });
    });

    it('should create second bid in the lot1 for authorization user1 in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: 27 })
        .expect(201);

      bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
      expect(bidsExist[1].lotId).toEqual(lotsExist[0].id);
      expect(bidsExist[1].proposedPrice).toEqual(27);
    });

    it('should create a bid in lot1 for authorization user2 in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ proposedPrice: 28 })
        .expect(201);

      bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
      expect(bidsExist[2].lotId).toEqual(lotsExist[0].id);
      expect(bidsExist[2].proposedPrice).toEqual(28);
    });

    it('should create a bid in lot2 for authorization user2 in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[1].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ proposedPrice: 10 })
        .expect(201);

      bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
      expect(bidsExist[3].lotId).toEqual(lotsExist[1].id);
      expect(bidsExist[3].proposedPrice).toEqual(10);
    });

    it('should not create a bid in lot2 if lot status is not equal to "IN_PROCESS"', async () => {
      // change lots status
      await lotRepository.query(`UPDATE "lot" SET "status" = 'CLOSED'`);

      await client
        .post(`/lots/${lotsExist[1].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ proposedPrice: 10 })
        .expect(400);

      // change lots status
      await lotRepository.query(`UPDATE "lot" SET "status" = 'PENDING'`);

      await client
        .post(`/lots/${lotsExist[1].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ proposedPrice: 10 })
        .expect(400);

    });
  });

  describe(`GET /lots/id/bids`, () => {
    it('should not return bids for a non-autorization user', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/bids`)
        .expect(401);
    });

    it('should return bids in lot1 for authorization user1', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.length).toEqual(3);
        });
    });

    it('should return bids in lot1 for authorization user2', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.length).toEqual(3);
        });
    });

    it('should return bids in lot2 for authorization user2', async () => {
      await client
        .get(`/lots/${lotsExist[1].id}/bids`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.length).toEqual(1);
        });
    });
  });

});
