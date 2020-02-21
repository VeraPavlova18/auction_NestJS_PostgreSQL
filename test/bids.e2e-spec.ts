import { UserRepository } from '../src/auth/user.repository';
import { users, lots } from './constants';
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

    it('should create a bid for authorization user1 in the DB', async () => {
      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ proposedPrice: 25 })
        .expect(201);

      const bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
      expect(bidsExist[0].lotId).toEqual(lotsExist[0].id);
      expect(bidsExist[0].proposedPrice).toEqual(25);
    });
  });

  describe(`GET /lots/id/bids`, () => {
    it('should not return bids for a non-autorization user', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/bids`)
        .expect(401);
    });

    it('should return bids for authorization user1', async () => {
      await client
        .get(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);
    });
  });

});
