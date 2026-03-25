/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LokiLoggerService } from '@org/backend-logging';

function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(LokiLoggerService));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin(origin, callback) {
      // allow server-to-server / curl / same-origin cases with no Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  app
    .get(LokiLoggerService)
    .log(`Application is running on PORT:${port}/${globalPrefix}`);
}

bootstrap();
