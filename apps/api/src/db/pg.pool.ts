import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

export const pgPoolProvider = {
  provide: PG_POOL,
  useFactory: () => {
    const ssl =
      String(process.env.PGSSL ?? '').toLowerCase() === 'true'
        ? { rejectUnauthorized: false }
        : undefined;

    return new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl,
      max: 10,
    });
  },
};
