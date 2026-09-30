import assert from 'node:assert/strict';
const base =
  process.env.PILOT_URL ??
  'http://127.0.0.1:3011/assistant/pilot/conversations';
async function post(url, body = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  assert.ok(r.ok, JSON.stringify(result));
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
      facts: result.state.facts,
      operation: result.operation,
    }),
  );
  return result;
}
let result = await turn('ami instalaciq na malka ku6ta na selo');
assert.equal(result.state.facts.roomCount, undefined);
assert.equal(result.state.active.estimate, null);
assert.doesNotMatch(result.reply, /3 стаи/);
result = await turn(
  '3 stai kuhnq, banq i koridor... iskam da imam za v bude6te termo pompa vuzduh voda i EV stanciq',
);
assert.equal(result.state.facts.heatPumpPlan, 'future');
assert.equal(result.state.facts.evChargerPlan, 'future');
assert.match(result.reply, /НЕ са включени/);
const snapshot = result.state.active;
result = await turn('DObre');
assert.equal(result.operation, 'breakdown');
assert.match(result.reply, /14 контакта и 6 обикновени ключа/);
assert.doesNotMatch(result.reply, /20 ключа/);
assert.deepEqual(result.state.active, snapshot);
result = await turn('Obre');
assert.deepEqual(result.state.active, snapshot);
result = await turn('Davai');
assert.deepEqual(result.state.active, snapshot);
result = await turn('A zashto ne samo edna DTZ za vsichko?');
assert.deepEqual(result.state.active, snapshot);
console.log(`PASS future equipment/breakdown/protection: ${conversation.id}`);
