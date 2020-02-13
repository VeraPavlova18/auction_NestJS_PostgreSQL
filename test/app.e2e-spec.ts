import * as request from 'supertest';
import { app } from './constants';

// npm run start:test for connecting to test db

describe('AppController (e2e)', () => {
  it('/ (GET)', () => {
    return request(app)
      .get('/')
      .expect(200);
  });
});
