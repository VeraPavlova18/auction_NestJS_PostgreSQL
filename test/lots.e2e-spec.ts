import { UserRepository } from '../src/auth/user.repository';
import { users, lots } from './constants';
import { createTestingAppModule } from './config/testingmodule-config';
import { LotRepository } from '../src/lots/lot.repository';
import { deleteFromTables } from './utils/deleteFromTables';

describe('LotsController (e2e)', () => {
  let lotRepository: LotRepository;
  let userRepository: UserRepository;
  let usersExist;
  let accessToken;
  let accessToken2;
  let client;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    lotRepository = init.lotRepository;
    userRepository = init.authRepository;
  });

  afterAll(async () => {
    await deleteFromTables({lot: lotRepository, user: userRepository});
  });

  describe('POST /lots', () => {
    it('should not create a lot for unauthorized user in the DB', async () => {
      await client
        .post('/lots')
        .send(lots[0])
        .expect(401);
    });

    it('should create a lot for authorization user1 in the DB', async () => {
      await client.post('/auth/signup').send(users[0]);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client.get(`/auth/confirm/${usersExist[0].confirmToken}`);
      const query = await client.post('/auth/signin').send({ email: users[0].email, password: users[0].password });
      accessToken = query.body.accessToken;

      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[0])
        .expect(201);

      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      expect(lotsExist[0].title).toEqual(lots[0].title);
      expect(lotsExist[0].description).toEqual(lots[0].description);
      expect(lotsExist[0].userId).toEqual(usersExist[0].id);
    });

    it('should create a lot for authorization user2 in the DB', async () => {
      await client.post('/auth/signup').send(users[7]);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client.get(`/auth/confirm/${usersExist[1].confirmToken}`);
      const query = await client.post('/auth/signin').send({ email: users[7].email, password: users[7].password });
      accessToken2 = query.body.accessToken;

      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(lots[5])
        .expect(201);

      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      expect(lotsExist[1].title).toEqual(lots[5].title);
      expect(lotsExist[1].description).toEqual(lots[5].description);
      expect(lotsExist[1].userId).toEqual(usersExist[1].id);
    });

    it('should not create a lot where start time is later than end time', async () => {
      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[1])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.IsMoreThan).toEqual(
            `End Time must be later than start Time`,
          );
        });
    });

    it('should not create a lot where startTime is early than current date', async () => {
      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[2])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.minDate).toContain(
            `minimal allowed date for startTime is`,
          );
        });
    });

    it('should not create a lot where curentPrice is more than EstimatedPrice', async () => {
      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[3])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.IsMoreThan).toEqual(
            `EstimatedPrice must be more than curentPrice`,
          );
        });
    });

    it('should not create a lot for ', async () => {
      await client
        .post('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(lots[4])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isPositive).toEqual(
            `curentPrice must be a positive number`,
          );
        });
    });
  });

  describe('GET /', () => {
    it('should return all created lots with status IN_PROCESS', async () => {
      await client
        .get('/lots')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual([]);
        });
    });

    it('should not return all lots for a non-autorization user', async () => {
      await client
        .get('/lots')
        .expect(401);
    });
  });

  describe('GET /my', () => {
    it('should return all created lots by user1', async () => {
      await client
        .get('/lots/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body[0].userId).toEqual(usersExist[0].id);
        });
    });

    it('should not return lots for a non-autorization user', async () => {
      await client
        .get('/lots/my')
        .expect(401);
    });
  });

  describe('GET /id', () => {
    it('should return lot by id', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      await client
        .get(`/lots/${lotsExist[0].id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toEqual(lotsExist[0].id);
        });
    });

    it('should not return a lot by a non-existent id', async () => {
      await client
        .get(`/lots/123`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should not return a lot for a non-autorization user', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      await client
        .get(`/lots/${lotsExist[0].id}`)
        .expect(401);
    });
  });

  describe('PATCH /:id/edit', () => {
    it('should return all created lots by user1', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      await client
        .patch(`/lots/${lotsExist[0].id}/edit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'new Title 777',
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body.title).toEqual('new Title 777');
        });

      const lotsExistAfterUpdate = await lotRepository.query(`SELECT * FROM "lot"`);
      expect(lotsExistAfterUpdate[1].title).toEqual('new Title 777');
    });
  });

  describe('DELETE /id', () => {
    it('should not delete a lot for a non-autorization user', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      await client
        .delete(`/lots/${lotsExist[0].id}`)
        .expect(401);
    });

    it('should not delete a lot by a non-existent id', async () => {
      await client
        .delete(`/lots/123`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should not delete a lot for a non-owner user', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      await client
        .delete(`/lots/${lotsExist[1].id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);
    });

    it('should delete lot by id', async () => {
      const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);
      const lotId = lotsExist[1].id;
      await client
        .delete(`/lots/${lotId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const lotsExistAfterDelete = await lotRepository.query(`SELECT * FROM "lot"`);
      expect(lotsExist.length).not.toEqual(lotsExistAfterDelete.length);

      await client
        .get(`/lots/${lotId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
