import { UserRepository } from '../src/auth/user.repository';
import { users } from './constants';
import { createTestingAppModule } from './config/testingmodule-config';
import { deleteFromTables } from './utils/deleteFromTables';

describe('AuthController (e2e)', () => {
  let userRepository: UserRepository;
  let client;
  let usersExist;

  beforeAll(async () => {
    const init = await createTestingAppModule();
    client = init.client;
    userRepository = init.authRepository;
  });

  afterAll(async () => {
    await deleteFromTables({user: userRepository});
  });

  describe('POST /auth/signup', () => {
    it('should create a user in the DB', async () => {
      await client
        .post('/auth/signup')
        .send(users[0])
        .expect(201)
        .expect(({ body }) => {
          expect(body.password).toEqual(undefined);
          expect(body.email).toEqual(users[0].email);
        });

      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      expect(usersExist[0].email).toEqual(users[0].email);
    });

    it('should not create a user with duplicate email', async () => {
      await client
        .post('/auth/signup')
        .send(users[0])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toEqual(
            `User with email: ${users[0].email} already exist!`,
          );
        });
    });

    it('should not create a user with duplicate phone', async () => {
      await client
        .post('/auth/signup')
        .send(users[1])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toEqual(
            `User with phone: ${users[1].phone} already exist!`,
          );
        });
    });

    it('should not create a user with phone that is not phone', async () => {
      await client
        .post('/auth/signup')
        .send(users[3])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.matches).toEqual(
            `Invalid phone number`,
          );
        });
    });

    it('should not create a user with email that is not email', async () => {
      await client
        .post('/auth/signup')
        .send(users[4])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isEmail).toEqual(
            'email must be an email',
          );
        });
    });

    it('should not create a user with a password that does not match dto', async () => {
      await client
        .post('/auth/signup')
        .send(users[6])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.matches).toEqual(
            'Passport must be from 8 to 20 symbol length and matches at min: one symbol A-Z, one a-z and number or characters _, -',
          );
        });
    });

    it('should not create a user whose age is < 21', async () => {
      await client
        .post('/auth/signup')
        .send(users[5])
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.maxDate).toContain(
            'maximal allowed date for birthday is',
          );
        });
    });
  });

  describe('POST /auth/signin', () => {
    it('should not return token if user not confirmed', async () => {
      await client
        .post('/auth/signin')
        .send({ email: users[0].email, password: users[0].password })
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toEqual('Confirm your email address');
        });
    });

    it('should not return token if user not exist', async () => {
      await client
        .post('/auth/signin')
        .send({ email: users[2].email, password: users[2].password })
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toEqual('Invalid credentials');
        });
    });

    it('should not return token if user password is wrong', async () => {
      await client
        .post('/auth/signin')
        .send({ email: users[0].email, password: 'Wrongpass123' })
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toEqual('Invalid credentials');
        });
    });

    it('should not return token if user email is not email', async () => {
      await client
        .post('/auth/signin')
        .send({ email: 'test', password: users[2].password })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.isEmail).toEqual(
            'email must be an email',
          );
        });
    });

    it('should not return token if user password does not match dto', async () => {
      await client
        .post('/auth/signin')
        .send({ email: users[6].email, password: users[6].password })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0].constraints.matches).toEqual(
            'Passport must be from 8 to 20 symbol length and matches at min: one symbol A-Z, one a-z and number or characters _, -',
          );
        });
    });
  });

  describe('Get /auth/confirm/:confirmToken', () => {
    it('should confirmed an exist user', async () => {
      await client
        .get(`/auth/confirm/${usersExist[0].confirmToken}`)
        .expect(200);
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      expect(usersExist[0].isconfirm).toEqual(true);
    });

    it('should return token for exist user', async () => {
      await client
        .post('/auth/signin')
        .send({ email: users[0].email, password: users[0].password })
        .expect(201)
        .expect(({ body }) => {
          expect(body.accessToken).not.toBeUndefined();
        });
    });
  });

  describe('POST /auth/recovery', () => {
    it('it should send mail to exist user', async () => {
      await client
        .post('/auth/recovery')
        .send({ email: usersExist[0].email })
        .expect(201);

      expect(usersExist[0].confirmToken).not.toBeUndefined();
    });

    it('it should not find if user not exist', async () => {
      await client
        .post('/auth/recovery')
        .send({ email: 'notExistEmail@test.com' })
        .expect(404);
    });
  });

  describe('GET /auth/recovery-pass/:confirmToken', () => {
    it('it should find exist user', async () => {
      usersExist = await userRepository.query(`SELECT * FROM "user"`);
      await client
        .get(`/auth/recovery-pass/${usersExist[0].confirmToken}`)
        .expect(200);
    });

    it('it should not find if user not exist', async () => {
      await client.get(`/auth/recovery-pass/123`).expect(404);
    });
  });

  describe('POST /auth/recovery-pass/:confirmToken', () => {
    it('it should changePass and return token for exist user', async () => {
      await client
        .post(`/auth/recovery-pass/${usersExist[0].confirmToken}`)
        .send({ password: 'Qwerty123456', confirmPassword: 'Qwerty123456' })
        .expect(201);

      const usersExistWithNewPass = await userRepository.query(`SELECT * FROM "user"`);
      expect(usersExistWithNewPass[0].accessToken).toBeUndefined();
      expect(usersExistWithNewPass[0].password).not.toEqual(usersExist[0].password);
    });

    it('it should not changePass and return token if user not exist', async () => {
      await client
        .post(`/auth/recovery-pass/123`)
        .send({ password: 'Qwerty123456', confirmPassword: 'Qwerty123456' })
        .expect(404);
    });
  });
});
