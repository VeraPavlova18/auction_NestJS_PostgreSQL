import { UserRepository } from '../src/auth/user.repository';
import { users, lots } from './constants';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import { BidRepository } from '../src/bids/bid.repository';
import { deleteFromTables } from './utils/deleteFromTables';

describe('LotsController (e2e)', () => {
  let bidRepository: BidRepository;
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let usersExist;
  let accessToken;
  let accessToken2;
  let lotsExist;
  let client;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    bidRepository = init.bidRepository;
    lotRepository = init.lotRepository;
    userRepository = init.authRepository;
  });

  afterAll(async () => {
    await deleteFromTables({bid: bidRepository, lot: lotRepository, user: userRepository});
  });

  describe(`POST /lots/id/bids`, () => {
    it('should not create a bid for unauthorized user in the DB', async () => {

      // create 1 user and token1
      await client.post('/auth/signup').send(users[0]);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client.get(`/auth/confirm/${usersExist[0].confirmToken}`);
      const query1 = await client.post('/auth/signin').send({ email: users[0].email, password: users[0].password });
      accessToken = query1.body.accessToken;

      // create lot for user 1
      await client.post('/lots').set('Authorization', `Bearer ${accessToken}`).send(lots[0]);

      // create 2 user and token2
      await client.post('/auth/signup').send(users[7]);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client.get(`/auth/confirm/${usersExist[1].confirmToken}`);
      const query2 = await client.post('/auth/signin').send({ email: users[7].email, password: users[7].password });
      accessToken2 = query2.body.accessToken;

      // create lot for user 2
      await client.post('/lots').set('Authorization', `Bearer ${accessToken2}`).send(lots[5]);

      lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);

      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .send({proposedPrice: 10})
        .expect(401);
    });

    it('should create a bid for authorization user1 in the DB', async () => {

      await lotRepository.query(`UPDATE "lot" SET "status" = 'IN_PROCESS'`);
      lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);

      await client
        .post(`/lots/${lotsExist[0].id}/bids`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

});
