import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { UserRepository } from '../src/auth/user.repository';
import { users, lots } from './constants';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import * as moment from 'moment';

describe('LotsController (e2e)', () => {
  let app: INestApplication;
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let usersExist;
  let accessToken;

  beforeAll(async () => {
    app = (await createTestingAppModule()).app;
    lotRepository = (await createTestingAppModule()).lotRepository;
    userRepository = (await createTestingAppModule()).authRepository;
  });

  afterAll(async () => {
    await lotRepository.query(`DELETE FROM "lot";`);
    await userRepository.query(`DELETE FROM "user";`);
  });

  describe('POST /lots', () => {
    it('should not create a lot for unauthorized user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());
      await client.post('/auth/signup').send(users[0]);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client.get(`/auth/confirm/${usersExist[0].confirmToken}`);
      const query = await client.post('/auth/signin').send({ email: users[0].email, password: users[0].password });
      accessToken = query.body.accessToken;

      await client
        .post('/lots')
        .send(lots[0])
        .expect(401);
    });

    it('should create a lot for authorization user in the DB', async () => {
      const client = supertest.agent(app.getHttpServer());

      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[0])
        .expect(201);

      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
    });

  });
});
