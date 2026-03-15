/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createSchema('assistant', { ifNotExists: true });

  pgm.createTable(
    { schema: 'assistant', name: 'conversations' },
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      tenant_slug: {
        type: 'text',
        notNull: true,
      },
      visitor_id: {
        type: 'text',
        notNull: false,
      },
      channel: {
        type: 'text',
        notNull: true,
        default: 'web',
      },
      status: {
        type: 'text',
        notNull: true,
        default: 'active',
      },
      lead_id: {
        type: 'uuid',
        notNull: false,
      },
      started_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
      last_message_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
      completed_at: {
        type: 'timestamptz',
        notNull: false,
      },
      meta: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'{}'::jsonb`),
      },
    }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'conversations' },
    'tenant_slug',
    { name: 'assistant_conversations_tenant_slug_idx' }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'conversations' },
    'visitor_id',
    { name: 'assistant_conversations_visitor_id_idx' }
  );

  pgm.createTable(
    { schema: 'assistant', name: 'messages' },
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      conversation_id: {
        type: 'uuid',
        notNull: true,
        references: '"assistant"."conversations"',
        onDelete: 'CASCADE',
      },
      role: {
        type: 'text',
        notNull: true,
      },
      message_text: {
        type: 'text',
        notNull: true,
      },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },
      tokens_input: {
        type: 'integer',
        notNull: false,
      },
      tokens_output: {
        type: 'integer',
        notNull: false,
      },
      model: {
        type: 'text',
        notNull: false,
      },
      meta: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'{}'::jsonb`),
      },
    }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'messages' },
    'conversation_id',
    { name: 'assistant_messages_conversation_id_idx' }
  );

  pgm.createTable(
    { schema: 'assistant', name: 'leads' },
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      tenant_slug: {
        type: 'text',
        notNull: true,
      },
      conversation_id: {
        type: 'uuid',
        notNull: true,
        references: '"assistant"."conversations"',
        onDelete: 'CASCADE',
        unique: true,
      },
      name: {
        type: 'text',
        notNull: false,
      },
      phone: {
        type: 'text',
        notNull: false,
      },
      email: {
        type: 'text',
        notNull: false,
      },
      location: {
        type: 'text',
        notNull: false,
      },
      service_type: {
        type: 'text',
        notNull: false,
      },
      summary: {
        type: 'text',
        notNull: false,
      },
      status: {
        type: 'text',
        notNull: true,
        default: 'new',
      },
      source: {
        type: 'text',
        notNull: true,
        default: 'assistant_chat',
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
      meta: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'{}'::jsonb`),
      },
    }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'leads' },
    'tenant_slug',
    { name: 'assistant_leads_tenant_slug_idx' }
  );
};

exports.down = (pgm) => {
  pgm.dropTable({ schema: 'assistant', name: 'leads' }, { ifExists: true });
  pgm.dropTable({ schema: 'assistant', name: 'messages' }, { ifExists: true });
  pgm.dropTable({ schema: 'assistant', name: 'conversations' }, { ifExists: true });
};
