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
  const body = {
    message,
    expectedRevision: revision,
    turnId: crypto.randomUUID(),
  };
  const result = await post(`${base}/${conversation.id}/messages`, body);
  revision = result.turnRevision;
  console.log(
    JSON.stringify({
      message,
      reply: result.reply,
      facts: result.state.facts,
      revision,
      diagnostics: result.diagnostics,
    }),
  );
  assert.equal(result.diagnostics?.validationIssue, undefined);
  return { result, body };
}
const first = (await turn('Iskamnov ainstalciq v moqta garsionera')).result;
assert.equal(first.state.facts.propertyType, 'studio');
assert.ok(first.state.active.estimate);
const question = (await turn('Umno rele, tova za kakvo e?')).result;
assert.deepEqual(question.state.active, first.state.active);
assert.deepEqual(question.state.facts, first.state.facts);
const comparison = (
  await turn(
    'Samo za sravnenie: kolko bi struvało s 2 umni releta? Ne gi dobavqj oshte.',
  )
).result;
assert.deepEqual(comparison.state.active, first.state.active);
assert.equal(comparison.state.candidate.snapshot.facts.smartRelayCount, 2);
const { result: accepted, body } = await turn('Da, priemam tova predlojenie.');
assert.equal(accepted.operation, 'accept');
assert.equal(accepted.state.facts.smartRelayCount, 2);
const retry = await post(`${base}/${conversation.id}/messages`, body);
assert.equal(retry.reply, accepted.reply);
assert.equal(retry.turnRevision, revision);
const walls = (await turn('Da, ama trqbva li da se kurtqt stenite?')).result;
assert.deepEqual(walls.state.active, accepted.state.active);
const prices = (await turn('Imate li cenorazpis?')).result;
assert.deepEqual(prices.state.active, accepted.state.active);
assert.match(prices.reply, /EUR|евро|€/);
console.log(
  `PASS: pilot conversation ${conversation.id}, ${revision} turns plus retry`,
);
