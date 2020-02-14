import * as dotenv from 'dotenv';
dotenv.config();

import * as moment from 'moment';
import { AuthCredentialsDto } from '../src/auth/dto/auth-credentials.dto';

export const app = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`;

export const users: AuthCredentialsDto[] = [
  {
    firstName: 'Test user1',
    lastName: 'Pavlova1',
    email: 'test@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user2',
    lastName: 'Pavlova2',
    email: 'test2@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user3',
    lastName: 'Pavlova3',
    email: 'test2@test.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user4',
    lastName: 'Pavlova4',
    email: 'test4@test.com',
    phone: '123',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user5',
    lastName: 'Pavlova4',
    email: 'test5',
    phone: '12345',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user6',
    lastName: 'Pavlova6',
    email: 'test6@email.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('2006-12-19').toDate(),
  },
];
