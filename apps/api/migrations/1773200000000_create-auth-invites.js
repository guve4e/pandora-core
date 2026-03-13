/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable('auth_invites', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants',
      onDelete: 'CASCADE',
    },
    email: {
      type: 'text',
      notNull: true,
    },
    role: {
      type: 'text',
      notNull: true,
      default: 'owner',
    },
    token_hash: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    accepted_at: {
      type: 'timestamptz',
    },
    created_by_user_id: {
      type: 'uuid',
      references: 'auth_users',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('auth_invites', ['tenant_id']);
  pgm.createIndex('auth_invites', ['email']);
  pgm.createIndex('auth_invites', ['expires_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('auth_invites');
};
