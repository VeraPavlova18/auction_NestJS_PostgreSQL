import * as request from 'supertest';
import { app } from './constants';
import { AuthCredentialsDto } from 'src/auth/dto/auth-credentials.dto';
import * as moment from 'moment';

// npm run start:test for connecting to test db

describe('AUTH', () => {
  const user: AuthCredentialsDto = {
    firstName: 'Test user',
    lastName: 'Pavlova',
    email: 'pavlova.vera18@gmail.com',
    phone: '111111111111',
    password: 'Qwerty123',
    birthday: moment('1992-12-19').toDate(),
  };

  it('/auth/signup (POST)', () => {
    return request(app)
      .post('/auth/signup')
      .send(user)
      .expect(201);
  });

  it('/auth/signin (POST)', () => {
    return request(app)
      .post('/auth/signin')
      .send({ email: user.email, password: user.password })
      .expect(200);
  });

});
