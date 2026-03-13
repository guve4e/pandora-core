import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

import { PG_POOL } from './pg.tokens.js';
import { TenantDb } from './tenant-db.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const host = cfg.get<string>('PGHOST');
        const port = Number(cfg.get<string>('PGPORT', '5432'));
        const database = cfg.get<string>('PGDATABASE');
        const user = cfg.get<string>('PGUSER');
        const password = cfg.get<string>('PGPASSWORD');
        const ssl = cfg.get<string>('PGSSL', 'false') === 'true';

        return new Pool({
          host,
          port,
          database,
          user,
          password,
          ssl: ssl ? { rejectUnauthorized: false } : false,
        });
      },
    },
    TenantDb,
  ],
  exports: [PG_POOL, TenantDb],
})
export class PgModule {}
