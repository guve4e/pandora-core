/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn(
    { schema: 'assistant', name: 'assistant_configs' },
    {
      language: {
        type: 'text',
        notNull: true,
        default: 'bg',
      },
    },
  );
};

exports.down = (pgm) => {
  pgm.dropColumn(
    { schema: 'assistant', name: 'assistant_configs' },
    'language',
    { ifExists: true },
  );
};
