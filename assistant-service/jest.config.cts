module.exports = {
  displayName: 'assistant-service',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', { swcrc: false, jsc: { target: 'es2021', parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true } }, module: { type: 'commonjs' } }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
