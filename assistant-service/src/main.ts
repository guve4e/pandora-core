import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { LokiLoggerService } from '@org/backend-logging';
import { getAppConfig } from './app/config';

async function bootstrap() {
  const config = getAppConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(LokiLoggerService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(config.globalPrefix);

  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  await app.listen(config.port);

  const logger = app.get(LokiLoggerService);
  logger.log(
    `Assistant service running on PORT:${config.port}/${config.globalPrefix}`,
  );
  logger.log(`Assistant CORS origins: ${JSON.stringify(config.corsOrigins)}`);
}

bootstrap();
