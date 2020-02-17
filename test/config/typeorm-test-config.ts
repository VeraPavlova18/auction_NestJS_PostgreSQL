import * as dotenv from 'dotenv';
dotenv.config();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmTestConfig: TypeOrmModuleOptions = {
  type: process.env.TYPE as any,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'auction_test',
  entities: [__dirname + '/../../**/*.entity.{js,ts}'],
  synchronize: Boolean(process.env.TYPEORM_SYNC),
};
