export type LogMeta = Record<string, unknown>;

export type RedactedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: Record<string, unknown>;
};

export interface AppLoggerService {
  log(message: string, meta?: LogMeta | string): void;
  warn(message: string, meta?: LogMeta | string): void;
  debug(message: string, meta?: LogMeta | string): void;
  verbose?(message: string, meta?: LogMeta | string): void;
  error(
    message: string,
    stackOrMeta?: string | LogMeta,
    requestOrContext?: RedactedRequest | string,
    meta?: LogMeta,
  ): void;
}
