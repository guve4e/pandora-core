export const up = (pgm) => {
  pgm.createTable('tenants', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },

    name: {
      type: 'text',
      notNull: true,
    },

    slug: {
      type: 'text',
      unique: true,
      notNull: true,
    },

    created_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
  });

  pgm.addColumn('auth_users', {
    tenant_id: {
      type: 'uuid',
      references: 'tenants',
      onDelete: 'cascade',
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('auth_users', 'tenant_id');

  pgm.dropTable('tenants');
};
