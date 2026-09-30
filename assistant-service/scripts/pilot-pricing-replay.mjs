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
  const v = await r.json();
  assert.ok(r.ok, JSON.stringify(v));
  return v;
}
const c = await post(base);
let revision = 0;
async function turn(message) {
  const r = await post(`${base}/${c.id}/messages`, {
    message,
    turnId: crypto.randomUUID(),
    expectedRevision: revision,
  });
  revision = r.turnRevision;
  console.log(JSON.stringify({ message, reply: r.reply }));
  return r;
}
const first = await turn('Osnoven remont v 3 staen apartament');
const answer = await turn(
  'Zna4i 10 evro na to4ka.. a poneje kontakta e to4ka i kontakt e 20 zatova li? demek kabela do lampata e to4ka demek 10 i samat alampa o6te 10',
);
assert.deepEqual(answer.state.active, first.state.active);
assert.doesNotMatch(answer.reply, /Не успях|опитайте отново/);
assert.match(answer.reply, /20\.00 EUR/);
assert.match(answer.reply, /10\.00 EUR/);
console.log(`PASS pricing explanation without quote mutation: ${c.id}`);
