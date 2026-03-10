export type LogMeta = Record<string, unknown>;

export type RedactedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: Record<string, unknown>;
};

export interface LoggerService {
  log(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  error(
    message: string,
    options?: {
      stack?: string;
      request?: RedactedRequest;
      meta?: LogMeta;
    },
  ): void;
}
