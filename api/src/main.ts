/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LokiLoggerService } from './app/core/logging/loki-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(LokiLoggerService));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  app
    .get(LokiLoggerService)
    .log(`Application is running on PORT:${port}/${globalPrefix}`);
}

bootstrap();

