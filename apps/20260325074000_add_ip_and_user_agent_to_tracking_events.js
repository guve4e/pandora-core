/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns(
    { schema: 'analytics', name: 'tracking_events' },
    {
      ip_address: { type: 'text' },
      user_agent: { type: 'text' },
    },
  );
};

exports.down = (pgm) => {
  pgm.dropColumns(
    { schema: 'analytics', name: 'tracking_events' },
    ['ip_address', 'user_agent'],
  );
};
