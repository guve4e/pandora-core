/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns({ schema: 'assistant', name: 'conversations' }, {
    summary: { type: 'text' },
    intent: { type: 'text' },
    city: { type: 'text' },
    service_type: { type: 'text' },
    lead_score: { type: 'integer', notNull: true, default: 0 },
  });

  pgm.createIndex(
    { schema: 'assistant', name: 'conversations' },
    'lead_score',
    {
      name: 'assistant_conversations_lead_score_idx',
    },
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'conversations' },
    'intent',
    {
      name: 'assistant_conversations_intent_idx',
    },
  );

  pgm.createIndex(
    { schema: 'assistant', name: 'conversations' },
    'city',
    {
      name: 'assistant_conversations_city_idx',
    },
  );
};

exports.down = (pgm) => {
  pgm.dropIndex(
    { schema: 'assistant', name: 'conversations' },
    'city',
    {
      name: 'assistant_conversations_city_idx',
    },
  );

  pgm.dropIndex(
    { schema: 'assistant', name: 'conversations' },
    'intent',
    {
      name: 'assistant_conversations_intent_idx',
    },
  );

  pgm.dropIndex(
    { schema: 'assistant', name: 'conversations' },
    'lead_score',
    {
      name: 'assistant_conversations_lead_score_idx',
    },
  );

  pgm.dropColumns(
    { schema: 'assistant', name: 'conversations' },
    ['summary', 'intent', 'city', 'service_type', 'lead_score'],
  );
};
