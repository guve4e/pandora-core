// 1771438712690_init-auth.js

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('auth_users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    username: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true, default: 'user' },
    refresh_token_hash: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('auth_users', { ifExists: true });
  // keep extension; don't drop it
};
