exports.up = (pgm) => {
  pgm.createSchema('assistant', { ifNotExists: true });

  pgm.createTable(
    { schema: 'assistant', name: 'ai_usage' },
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()'),
      },

      provider: { type: 'text', notNull: true },
      model: { type: 'text', notNull: true },

      app: { type: 'text', notNull: true },
      feature: { type: 'text', notNull: true },

      tenant_slug: { type: 'text' },
      conversation_id: { type: 'uuid' },
      visitor_id: { type: 'text' },

      input_tokens: { type: 'integer' },
      output_tokens: { type: 'integer' },
      total_tokens: { type: 'integer' },

      estimated_cost_usd: { type: 'numeric(12,6)' },
      latency_ms: { type: 'integer' },

      meta: {
        type: 'jsonb',
        notNull: true,
        default: pgm.func(`'{}'::jsonb`),
      },
    }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'ai_usage' },
    ['tenant_slug', 'created_at'],
    { name: 'assistant_ai_usage_tenant_created_at_idx' }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'ai_usage' },
    ['conversation_id', 'created_at'],
    { name: 'assistant_ai_usage_conversation_created_at_idx' }
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'ai_usage' },
    ['app', 'feature', 'created_at'],
    { name: 'assistant_ai_usage_app_feature_created_at_idx' }
  );
};

exports.down = (pgm) => {
  pgm.dropTable({ schema: 'assistant', name: 'ai_usage' }, { ifExists: true });
};
