import { users, lots } from '../constants';

export async function createUsers(client, userRepository) {
  // create 1 user
  await client.post('/auth/signup').send(users[0]);
  let usersExist = await userRepository.query(`SELECT * FROM "user"`);
  await client.get(`/auth/confirm/${usersExist[0].confirmToken}`);

  // create 2 user and token2
  await client.post('/auth/signup').send(users[7]);
  usersExist = await userRepository.query(`SELECT * FROM "user"`);
  await client.get(`/auth/confirm/${usersExist[1].confirmToken}`);

  // final update of the users array
  usersExist = await userRepository.query(`SELECT * FROM "user"`);

  return { usersExist };
}

export async function createTokens(client) {
  // create token1
  const query = await client.post('/auth/signin').send({ email: users[0].email, password: users[0].password });
  const accessToken1 = query.body.accessToken;

  // create token2
  const query2 = await client.post('/auth/signin').send({ email: users[7].email, password: users[7].password });
  const accessToken2 = query2.body.accessToken;

  return { accessToken1, accessToken2 };
}

export async function createLots(client, accessToken1, accessToken2, lotRepository) {
  // create lot for user1
  await client.post('/lots').set('Authorization', `Bearer ${accessToken1}`).send(lots[0]);

  // create lot for user2
  await client.post('/lots').set('Authorization', `Bearer ${accessToken2}`).send(lots[5]);

  // change lots status
  await lotRepository.query(`UPDATE "lot" SET "status" = 'IN_PROCESS'`);

  // get array of lots
  const lotsExist = await lotRepository.query(`SELECT * FROM "lot"`);

  return { lotsExist };
}
