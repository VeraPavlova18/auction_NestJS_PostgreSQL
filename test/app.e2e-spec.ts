import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { createTestingAppModule } from './config/testingmodule-config';

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const app: INestApplication = await createTestingAppModule();
    const client = supertest.agent(app.getHttpServer());
    await client.get('/').expect(200);
  });
});
