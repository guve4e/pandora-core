/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable('lead_messages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    lead_id: {
      type: 'uuid',
      notNull: true,
      references: 'leads',
      onDelete: 'CASCADE',
    },
    role: {
      type: 'text',
      notNull: true,
    },
    text: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('lead_messages', ['lead_id']);
  pgm.createIndex('lead_messages', ['lead_id', 'created_at']);
};

exports.down = (pgm) => {
  pgm.dropTable('lead_messages');
};
