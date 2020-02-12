import * as dotenv from 'dotenv';
dotenv.config();

export const app = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/`;
