/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createSchema('assistant', { ifNotExists: true });

  pgm.createTable(
    { schema: 'assistant', name: 'assistant_configs' },
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      tenant_slug: {
        type: 'text',
        notNull: true,
        unique: true,
      },
      business_name: {
        type: 'text',
        notNull: true,
      },
      business_description: {
        type: 'text',
        notNull: true,
        default: '',
      },
      services_json: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'[]'::jsonb`),
      },
      facts_json: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'[]'::jsonb`),
      },
      contact_prompt: {
        type: 'text',
        notNull: false,
      },
      tone: {
        type: 'text',
        notNull: false,
      },
      is_active: {
        type: 'boolean',
        notNull: true,
        default: true,
      },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
      updated_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
    }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'assistant_configs' },
    'tenant_slug',
    { unique: true, name: 'assistant_configs_tenant_slug_idx' }
  );
};

exports.down = (pgm) => {
  pgm.dropTable(
    { schema: 'assistant', name: 'assistant_configs' },
    { ifExists: true }
  );
};
