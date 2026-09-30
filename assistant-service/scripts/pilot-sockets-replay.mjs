import assert from 'node:assert/strict';
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
  assert.ok(response.ok, JSON.stringify(result));
  return result;
}
const conversation = await post(base);
let revision = 0;
async function turn(message) {
  const result = await post(`${base}/${conversation.id}/messages`, {
    message,
    turnId: crypto.randomUUID(),
    expectedRevision: revision,
  });
  revision = result.turnRevision;
  console.log(
    JSON.stringify({
      message,
      reply: result.reply,
      operation: result.operation,
      facts: result.state.facts,
    }),
  );
  return result;
}
const first = await turn('Osnoven remont v 3 staen apartament');
assert.ok(first.state.active.estimate);
assert.match(first.reply, /не ограничение/);
const breakdown = await turn('da');
assert.equal(breakdown.operation, 'breakdown');
const question = await turn('A moje li kolkoto kontakta iskam az?');
assert.deepEqual(question.state.active, first.state.active);
assert.deepEqual(question.state.facts, first.state.facts);
const changed = await turn('Iskam obshto 20 kontakta v apartamenta.');
assert.equal(changed.state.facts.socketCount, 20);
assert.ok(changed.state.active.estimate.min > first.state.active.estimate.min);
console.log(`PASS socket flexibility and explicit change: ${conversation.id}`);
