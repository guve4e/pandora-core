const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

function must(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

function dbConfig() {
  return {
    host: must('PGHOST'),
    port: Number(must('PGPORT')),
    database: must('PGDATABASE'),
    user: must('PGUSER'),
    password: must('PGPASSWORD'),
    ssl:
      String(process.env.PGSSL || '').toLowerCase() === 'true'
        ? { rejectUnauthorized: false }
        : false,
  };
}

async function ensureTenant(client, { name, slug }) {
  const existing = await client.query(
    `SELECT id, name, slug
     FROM tenants
     WHERE slug = $1
     LIMIT 1`,
    [slug],
  );

  if (existing.rows[0]) {
    console.log(`[seed] tenant exists: ${slug}`);
    return existing.rows[0];
  }

  const created = await client.query(
    `INSERT INTO tenants (name, slug)
     VALUES ($1, $2)
     RETURNING id, name, slug`,
    [name, slug],
  );

  console.log(`[seed] tenant created: ${slug}`);
  return created.rows[0];
}

async function ensureUser(client, { tenantId, username, password, role }) {
  const existing = await client.query(
    `SELECT id, tenant_id, username, role
     FROM auth_users
     WHERE tenant_id = $1 AND username = $2
     LIMIT 1`,
    [tenantId, username],
  );

  if (existing.rows[0]) {
    console.log(`[seed] user exists: ${username}`);
    return existing.rows[0];
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await client.query(
    `INSERT INTO auth_users (tenant_id, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tenant_id, username, role`,
    [tenantId, username, passwordHash, role],
  );

  console.log(`[seed] user created: ${username}`);
  return created.rows[0];
}

async function ensureDemoNotification(client, { tenantId, userId }) {
  if (!['dev', 'development', 'local'].includes(process.env.NODE_ENV || '')) {
    return;
  }

  const existing = await client.query(
    `SELECT id
     FROM notifications
     WHERE tenant_id = $1
       AND user_id = $2
       AND type = 'system.welcome'
     LIMIT 1`,
    [tenantId, userId],
  );

  if (existing.rows[0]) {
    console.log('[seed] demo notification exists');
    return;
  }

  await client.query(
    `INSERT INTO notifications (
       tenant_id,
       user_id,
       type,
       title,
       message,
       severity,
       is_read,
       created_at
     ) VALUES (
       $1, $2, 'system.welcome', 'Welcome',
       'Your notification system is ready.',
       'info',
       FALSE,
       NOW()
     )`,
    [tenantId, userId],
  );

  console.log('[seed] demo notification created');
}

async function main() {
  const client = new Client(dbConfig());

  const tenantName = process.env.SEED_TENANT_NAME || 'Default Tenant';
  const tenantSlug = process.env.SEED_TENANT_SLUG || 'default';
  const username = process.env.SEED_OWNER_USERNAME || 'val';
  const password = process.env.SEED_OWNER_PASSWORD || 'secret123';
  const role = process.env.SEED_OWNER_ROLE || 'owner';

  try {
    await client.connect();

    const tenant = await ensureTenant(client, {
      name: tenantName,
      slug: tenantSlug,
    });

    const user = await ensureUser(client, {
      tenantId: tenant.id,
      username,
      password,
      role,
    });

    await ensureDemoNotification(client, {
      tenantId: tenant.id,
      userId: user.id,
    });

    console.log('[seed] done');
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

