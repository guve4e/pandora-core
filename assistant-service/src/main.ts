import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LokiLoggerService } from '@org/backend-logging';
import { ValidationPipe } from '@nestjs/common';

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

  // 🔥 VALIDATION ENABLED
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // throw on unknown fields
      transform: true,
    }),
  );

  const globalPrefix = 'assistant';
  app.setGlobalPrefix(globalPrefix);

  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin(origin, callback) {
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

  const port = Number(process.env.PORT || 3010);
  await app.listen(port);

  app
    .get(LokiLoggerService)
    .log(`Assistant service running on PORT:${port}/${globalPrefix}`);

  app
    .get(LokiLoggerService)
    .log(`Assistant CORS origins: ${JSON.stringify(corsOrigins)}`);
}

bootstrap();
