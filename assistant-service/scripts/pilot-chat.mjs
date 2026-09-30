import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const base =
  process.env.PILOT_URL ??
  'http://127.0.0.1:3011/assistant/pilot/conversations';
async function post(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(`${response.status}: ${JSON.stringify(result.message)}`);
  return result;
}
const conversation = await post(base);
const terminal = createInterface({ input: stdin, output: stdout });
let revision = 0;
console.log(
  'Локален тест на Energrid. Опишете накратко какво планирате. /exit за край.',
);
try {
  while (true) {
    const message = (await terminal.question('\nВие: ')).trim();
    if (message === '/exit') break;
    if (!message) continue;
    try {
      const result = await post(`${base}/${conversation.id}/messages`, {
        message,
        turnId: crypto.randomUUID(),
        expectedRevision: revision,
      });
      revision = result.turnRevision;
      console.log(`\nEnergrid: ${result.reply}`);
    } catch (error) {
      console.error(`Тестът не завърши: ${error.message}`);
      break;
    }
  }
} finally {
  terminal.close();
}
