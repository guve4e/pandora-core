import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule } from '../../../logging/logging.module'; // <-- import it
import { MessagingService, MessagingTransport } from './messaging.service';
import { RedisMessagingStrategy } from './redis.messaging.strategy';
import { KafkaMessagingStrategy } from './kafka.messaging.strategy';
import { LoggerService } from '../../../logging/types';

function parseBrokers(v?: string | null): string[] {
  return (v ?? '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

@Module({
  imports: [ConfigModule, LoggingModule], // <-- add LoggingModule
  providers: [
    // REMOVE this block entirely:
    // { provide: 'LOGGER_SERVICE', useFactory: () => new LokiLoggerService('gm','mqtt') },

    {
      provide: 'REDIS_MESSAGING_STRATEGY',
      useFactory: (logger: LoggerService) => new RedisMessagingStrategy(logger),
      inject: ['LOGGER_SERVICE'],
    },

    {
      provide: 'KAFKA_MESSAGING_STRATEGY',
      useFactory: (logger: LoggerService, cfg: ConfigService) => {
        const enabled = cfg.get<string>('KAFKA_ENABLED', 'false') === 'true';
        if (!enabled) return null;

        const brokers = parseBrokers(cfg.get<string>('KAFKA_BROKERS'));
        if (!brokers.length) {
          throw new Error(
            '[MessagingModule] KAFKA_ENABLED=true but KAFKA_BROKERS is empty'
          );
        }

        const topic = cfg.get<string>('KAFKA_TOPIC', 'sensor-stats');
        return new KafkaMessagingStrategy(logger, topic, brokers);
      },
      inject: ['LOGGER_SERVICE', ConfigService],
    },

    {
      provide: 'MESSAGING_DEFAULT_TRANSPORT',
      useFactory: (cfg: ConfigService) => {
        const t = (cfg.get<string>('MESSAGING_TRANSPORT') ?? '').toLowerCase();
        if (t === 'redis') return MessagingTransport.REDIS;
        if (t === 'kafka') return MessagingTransport.KAFKA;

        const kafkaEnabled =
          cfg.get<string>('KAFKA_ENABLED', 'false') === 'true';
        return kafkaEnabled
          ? MessagingTransport.KAFKA
          : MessagingTransport.REDIS;
      },
      inject: [ConfigService],
    },

    {
      provide: 'MESSAGING_SERVICE',
      useFactory: (
        logger: LoggerService,
        kafkaStrategy: KafkaMessagingStrategy | null,
        redisStrategy: RedisMessagingStrategy,
        defaultTransport: MessagingTransport
      ) => {
        if (defaultTransport === MessagingTransport.KAFKA && !kafkaStrategy) {
          throw new Error(
            '[MessagingModule] MESSAGING_TRANSPORT=kafka but Kafka is not enabled/configured'
          );
        }

        return new MessagingService(
          logger,
          kafkaStrategy as any,
          redisStrategy,
          defaultTransport
        );
      },
      inject: [
        'LOGGER_SERVICE',
        'KAFKA_MESSAGING_STRATEGY',
        'REDIS_MESSAGING_STRATEGY',
        'MESSAGING_DEFAULT_TRANSPORT',
      ],
    },
  ],
  exports: ['MESSAGING_SERVICE'],
})
export class MessagingModule {}
