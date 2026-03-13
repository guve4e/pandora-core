const path = require('path');
const dotenv = require('dotenv');

// silent load of env
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

function must(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const host = must('PGHOST');
const port = must('PGPORT');
const db = must('PGDATABASE');
const user = must('PGUSER');
const pass = must('PGPASSWORD');

const ssl = String(process.env.PGSSL || '').toLowerCase() === 'true';
const sslmode = ssl ? 'require' : 'disable';

const url =
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}` +
  `@${host}:${port}/${db}?sslmode=${sslmode}`;

// IMPORTANT: only output URL
process.stdout.write(url);
