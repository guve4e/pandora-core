exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },

    tenant_id: {
      type: 'uuid',
      notNull: true,
    },

    user_id: {
      type: 'uuid',
      notNull: false,
    },

    type: {
      type: 'varchar(120)',
      notNull: true,
    },

    title: {
      type: 'varchar(255)',
      notNull: true,
    },

    message: {
      type: 'text',
      notNull: true,
    },

    severity: {
      type: 'varchar(20)',
      notNull: true,
      default: 'info',
    },

    entity_type: {
      type: 'varchar(80)',
      notNull: false,
    },

    entity_id: {
      type: 'varchar(120)',
      notNull: false,
    },

    link: {
      type: 'varchar(500)',
      notNull: false,
    },

    is_read: {
      type: 'boolean',
      notNull: true,
      default: false,
    },

    read_at: {
      type: 'timestamptz',
      notNull: false,
    },

    meta: {
      type: 'jsonb',
      notNull: false,
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('notifications', ['tenant_id', 'created_at'], {
    name: 'idx_notifications_tenant_created',
  });

  pgm.createIndex('notifications', ['tenant_id', 'user_id', 'created_at'], {
    name: 'idx_notifications_user_created',
  });

  pgm.createIndex('notifications', ['tenant_id', 'user_id', 'is_read', 'created_at'], {
    name: 'idx_notifications_unread',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('notifications', { ifExists: true });
};
