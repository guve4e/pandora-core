import {
  Inject,
  Injectable,
  LoggerService as NestLoggerService,
} from '@nestjs/common';
import winston, { createLogger, transports } from 'winston';
import LokiTransport from 'winston-loki';
import type { AppLoggerService, RedactedRequest } from './types.js';

type LogMeta = Record<string, unknown>;

@Injectable()
export class LokiLoggerService implements AppLoggerService, NestLoggerService {
  private readonly logger: winston.Logger;

  constructor(
    @Inject('JOB_NAME') private readonly job: string,
    @Inject('APP_NAME') private readonly appName: string,
    @Inject('LOKI_HOST') private readonly lokiHost: string,
  ) {
    this.logger = this.createLogger();
  }

  public get app(): string {
    return this.appName;
  }

  public log(message: string, metaOrContext?: LogMeta | string): void {
    this.logger.info(message, this.baseMeta(this.normalizeMeta(metaOrContext)));
  }

  public warn(message: string, metaOrContext?: LogMeta | string): void {
    this.logger.warn(message, this.baseMeta(this.normalizeMeta(metaOrContext)));
  }

  public debug(message: string, metaOrContext?: LogMeta | string): void {
    if (!this.isDevelopmentEnvironment()) return;
    this.logger.debug(
      message,
      this.baseMeta(this.normalizeMeta(metaOrContext)),
    );
  }

  public error(
    message: string,
    stackOrMeta?: string | LogMeta,
    requestOrContext?: RedactedRequest | string,
    meta?: LogMeta,
  ): void {
    let stack: string | undefined;
    let request: RedactedRequest | undefined;
    let finalMeta: LogMeta = {};

    if (typeof stackOrMeta === 'string') {
      stack = stackOrMeta;
    } else if (stackOrMeta && typeof stackOrMeta === 'object') {
      finalMeta = { ...stackOrMeta };
    }

    if (typeof requestOrContext === 'string') {
      finalMeta.context = requestOrContext;
    } else if (requestOrContext && typeof requestOrContext === 'object') {
      request = requestOrContext;
    }

    if (meta) {
      finalMeta = { ...finalMeta, ...meta };
    }

    this.logger.error(
      message,
      this.baseMeta({
        ...finalMeta,
        stack: stack ? this.cleanStackTrace(stack) : undefined,
        request: request ? this.redactRequest(request) : undefined,
      }),
    );
  }

  public verbose(message: string, metaOrContext?: LogMeta | string): void {
    if (!this.isDevelopmentEnvironment()) return;
    this.logger.verbose(
      message,
      this.baseMeta(this.normalizeMeta(metaOrContext)),
    );
  }

  private normalizeMeta(metaOrContext?: LogMeta | string): LogMeta {
    if (!metaOrContext) return {};

    if (typeof metaOrContext === 'string') {
      return { context: metaOrContext };
    }

    return metaOrContext;
  }

  private baseMeta(meta?: LogMeta): LogMeta {
    return {
      app: this.appName,
      job: this.job,
      ...meta,
    };
  }

  private createLogger(): winston.Logger {
    return createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: this.initializeTransports(),
    });
  }

  private initializeTransports(): winston.transport[] {
    const list: winston.transport[] = [];

    if (this.lokiHost) {
      list.push(this.createLokiTransport());
    }

    if (this.isDevelopmentEnvironment() || list.length === 0) {
      list.push(this.createConsoleTransport());
    }

    return list;
  }

  private createLokiTransport(): LokiTransport {
    return new LokiTransport({
      host: this.lokiHost,
      labels: {
        job: this.job,
        app: this.appName,
      },
      json: true,
      replaceTimestamp: true,
      onConnectionError: (err: Error) => {
        console.error('[LokiLoggerService] Loki connection error:', err);
      },
    });
  }

  private createConsoleTransport(): winston.transport {
    return new transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const context =
            typeof meta.context === 'string' ? `[${meta.context}]` : '';

          const stack =
            typeof meta.stack === 'string' && meta.stack.trim()
              ? `\n${meta.stack}`
              : '';

          const { context: _context, stack: _stack, ...restMeta } = meta;
          const rest =
            Object.keys(restMeta).length > 0
              ? ` ${JSON.stringify(restMeta)}`
              : '';

          return `${timestamp} ${level}: ${context} ${message}${rest}${stack}`.trim();
        }),
      ),
    });
  }

  private isDevelopmentEnvironment(): boolean {
    return ['dev', 'development', 'local'].includes(process.env.NODE_ENV || '');
  }

  private cleanStackTrace(stack: string, maxDepth = 8): string {
    if (!stack) return '';

    return stack
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !line.includes('node:internal'))
      .slice(0, maxDepth)
      .join('\n');
  }

  private redactRequest(request: RedactedRequest) {
    return {
      method: request.method,
      url: request.url,
      headers: this.redactHeaders(request.headers ?? {}),
      body: this.redactBody(request.body),
    };
  }

  private redactHeaders(headers: Record<string, string>) {
    const sensitive = new Set([
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'api-key',
    ]);

    return Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [
        k,
        sensitive.has(k.toLowerCase()) ? '*****' : v,
      ]),
    );
  }

  private redactBody(body: Record<string, unknown> | undefined | null) {
    if (!body || typeof body !== 'object') return {};

    const sensitive = new Set([
      'password',
      'token',
      'access_token',
      'refresh_token',
      'secret',
      'api_key',
      'apikey',
      'creditcard',
      'cardnumber',
      'cvv',
    ]);

    return Object.fromEntries(
      Object.entries(body).map(([k, v]) => [
        k,
        sensitive.has(k.toLowerCase()) ? '*****' : v,
      ]),
    );
  }
}
