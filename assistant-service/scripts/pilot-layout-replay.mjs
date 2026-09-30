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
for (const scenario of [
  {
    message:
      'Remont v garsionera. Staq, otdelna kuhnq, koridor, banq i terasa. Iskam izcqlo nova instalaciq.',
    rooms: 1,
    lights: 5,
    type: 'studio',
  },
  {
    message:
      'Na selo imam ku6ta: dve stai, otdelna kuhnq, banq, koridor i terasa. Podmenqme cqlata instalaciq. Kolko trud gore dolu?',
    rooms: 2,
    lights: 6,
    type: 'house',
  },
]) {
  const conversation = await post(base);
  const result = await post(`${base}/${conversation.id}/messages`, {
    message: scenario.message,
    turnId: crypto.randomUUID(),
    expectedRevision: 0,
  });
  console.log(
    JSON.stringify({
      scenario: scenario.type,
      id: conversation.id,
      reply: result.reply,
      facts: result.state.facts,
      diagnostics: result.diagnostics,
    }),
  );
  assert.equal(result.diagnostics?.validationIssue, undefined);
  assert.equal(result.state.facts.propertyType, scenario.type);
  assert.equal(result.state.facts.separateKitchen, true);
  assert.equal(result.state.facts.terraceCount, 1);
  assert.ok(result.state.active.estimate);
  assert.equal(
    result.state.active.circuits.circuits.filter((circuit) =>
      circuit.id.startsWith('lighting-'),
    ).length,
    scenario.lights,
  );
}
console.log(
  'PASS: studio and house preserve explicitly listed lighting spaces',
);
