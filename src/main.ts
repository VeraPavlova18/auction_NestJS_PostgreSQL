import * as dotenv from 'dotenv';
dotenv.config();
import * as helmet from 'helmet';
import { MyLogger } from './logger/my-logger.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, logger: false });
  app.use(helmet());
  app.useLogger(new MyLogger());

  const port = process.env.PORT;
  await app.listen(port);
}
bootstrap();
