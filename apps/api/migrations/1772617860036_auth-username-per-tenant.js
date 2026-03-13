// migrations/XXXXXXXXXXXX_auth-username-per-tenant.js
exports.up = (pgm) => {
  // 1) Make tenant_id required (after we ensure data is safe)
  // If you already have users, you MUST backfill tenant_id before this.
  pgm.alterColumn('auth_users', 'tenant_id', { notNull: true });

  // 2) Drop the old global unique constraint
  pgm.dropConstraint('auth_users', 'auth_users_username_key');

  // 3) Add per-tenant unique constraint
  pgm.addConstraint('auth_users', 'auth_users_tenant_username_key', {
    unique: ['tenant_id', 'username'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('auth_users', 'auth_users_tenant_username_key');

  pgm.addConstraint('auth_users', 'auth_users_username_key', {
    unique: ['username'],
  });

  pgm.alterColumn('auth_users', 'tenant_id', { notNull: false });
};
