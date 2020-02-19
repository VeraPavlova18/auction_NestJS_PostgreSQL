import * as dotenv from 'dotenv';
dotenv.config();

import * as moment from 'moment';
import { AuthCredentialsDto } from '../src/auth/dto/auth-credentials.dto';
import { CreateLotDto } from '../src/lots/dto/create-lot.dto';

export const app = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`;

export const users: AuthCredentialsDto[] = [
  {
    firstName: 'Test user0',
    lastName: 'Pavlova0',
    email: 'test@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user1',
    lastName: 'Pavlova1',
    email: 'test1@test.com',
    phone: '0991233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user2',
    lastName: 'Pavlova2',
    email: 'test2@test.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user3',
    lastName: 'Pavlova3',
    email: 'test3@test.com',
    phone: '123',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user4',
    lastName: 'Pavlova4',
    email: 'test4',
    phone: '12345',
    password: 'Qwerty123',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user5',
    lastName: 'Pavlova5',
    email: 'test5@email.com',
    phone: '0661233312',
    password: 'Qwerty123',
    birthday: moment('2006-12-19').toDate(),
  },
  {
    firstName: 'Test user6',
    lastName: 'Pavlova6',
    email: 'test6@email.com',
    phone: '0661233312',
    password: 'wrong pass',
    birthday: moment('1991-12-19').toDate(),
  },
  {
    firstName: 'Test user7',
    lastName: 'Pavlova7',
    email: 'test7@email.com',
    phone: '0551233312',
    password: 'Qwerty12345',
    birthday: moment('1991-12-19').toDate(),
  },
];

export const lots: CreateLotDto[] = [
  {
    image: 'www.test.com/img1.jpg',
    title: 'title example1',
    description: 'description ex1',
    startTime: moment('2020-02-27').toDate(),
    endTime:  moment('2020-03-27').toDate(),
    curentPrice: 5,
    estimatedPrice: 555,
  },
  {
    image: 'www.test.com/img1.jpg',
    title: 'title example2',
    description: 'description ex2',
    startTime: moment('2020-04-27').toDate(),
    endTime:  moment('2020-03-27').toDate(),
    curentPrice: 5,
    estimatedPrice: 555,
  },
  {
    image: 'www.test.com/img1.jpg',
    title: 'title example3',
    description: 'description ex3',
    startTime: moment('2019-02-27').toDate(),
    endTime:  moment('2020-03-27').toDate(),
    curentPrice: 5,
    estimatedPrice: 555,
  },
  {
    image: 'www.test.com/img1.jpg',
    title: 'title example4',
    description: 'description ex4',
    startTime: moment('2020-02-27').toDate(),
    endTime:  moment('2020-03-27').toDate(),
    curentPrice: 555,
    estimatedPrice: 5,
  },
  {
    image: 'www.test.com/img1.jpg',
    title: 'title example5',
    description: 'description ex5',
    startTime: moment('2020-02-27').toDate(),
    endTime:  moment('2020-03-27').toDate(),
    curentPrice: -5,
    estimatedPrice: 555,
  },
  {
    image: 'www.test.com/img6.jpg',
    title: 'title example6',
    description: 'description ex6',
    startTime: moment('2020-03-10').toDate(),
    endTime:  moment('2020-04-10').toDate(),
    curentPrice: 6,
    estimatedPrice: 666,
  },
];
