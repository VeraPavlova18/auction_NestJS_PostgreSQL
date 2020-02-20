import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { UserRepository } from '../src/auth/user.repository';
import { users, lots } from './constants';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import * as moment from 'moment';
import { BidRepository } from '../src/bids/bid.repository';

describe('LotsController (e2e)', () => {
  let app: INestApplication;
  let bidRepository: BidRepository;
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let usersExist;
  let accessToken;
  let accessToken2;
  let lotsExist;

  beforeAll(async () => {
    app = (await createTestingAppModule()).app;
    bidRepository = (await createTestingAppModule()).bidRepository;
    lotRepository = (await createTestingAppModule()).lotRepository;
    userRepository = (await createTestingAppModule()).authRepository;
  });

  afterAll(async () => {
    await bidRepository.query(`DELETE FROM "bid";`);
    await lotRepository.query(`DELETE FROM "lot";`);
    await userRepository.query(`DELETE FROM "user";`);
  });

  describe(`POST /lots/id/bids`, () => {
    it('should not create a bid for unauthorized user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());

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

    // it('should create a bid for authorization user1 in the DB', async () => {
    //   const client = supertest.agent(app.getHttpServer());

    //   await lotRepository.query(`UPDATE "lot" SET "status" = 'IN_PROCESS'`);
    //   lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
    //   console.log(lotsExist[0].id)

    //   await client
    //     .post(`/lots/${lotsExist[0].id}/bids`)
    //     .set('Authorization', `Bearer ${accessToken}`)
    //     .send({ proposedPrice: 25 })
    //     .expect(201);

    //   // const bidsExist = await bidRepository.query(`SELECT * FROM "bid"`);
    //   // console.log(bidsExist);
    //   // expect(bidsExist[0].title).toEqual(lots[0].title);
    //   // expect(lotsExist[0].description).toEqual(lots[0].description);
    //   // expect(lotsExist[0].userId).toEqual(usersExist[0].id);
    // });
  });

});
