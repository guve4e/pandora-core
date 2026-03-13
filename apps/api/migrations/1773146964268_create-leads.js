exports.up = (pgm) => {
  pgm.createTable('leads', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },

    tenant_slug: {
      type: 'text',
      notNull: true,
    },

    name: {
      type: 'text',
    },

    phone: {
      type: 'text',
      notNull: true,
    },

    city: {
      type: 'text',
    },

    service_type: {
      type: 'text',
    },

    summary: {
      type: 'text',
    },

    source: {
      type: 'text',
      default: 'chat',
    },

    status: {
      type: 'text',
      default: 'new',
    },

    created_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('leads', ['tenant_slug']);
  pgm.createIndex('leads', ['status']);
};

exports.down = (pgm) => {
  pgm.dropTable('leads');
};
