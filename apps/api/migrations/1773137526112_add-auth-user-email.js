exports.up = (pgm) => {
  pgm.addColumn('auth_users', {
    email: {
      type: 'text',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('auth_users', 'email', { ifExists: true });
};
