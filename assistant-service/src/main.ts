import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LokiLoggerService } from '@org/backend-logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(LokiLoggerService));

  const globalPrefix = 'assistant';
  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4201',
      'https://energrid.ddns.net',
      'https://voltura.ddns.net',
    ],
    credentials: true,
  });

  const port = Number(process.env.PORT || 3010);
  await app.listen(port);

  app
    .get(LokiLoggerService)
    .log(`Assistant service running on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
