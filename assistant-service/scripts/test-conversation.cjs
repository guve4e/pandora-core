// Opt-in live test: one stored synthetic conversation and four model-backed turns.
const assert = require('node:assert/strict');
if (!process.argv.includes('--live')) {
  console.log('Use --live to test local assistant -> Core -> OpenAI. Creates a synthetic conversation; four paid model-backed turns.');
  process.exit(0);
}
const base = process.env.ASSISTANT_TEST_URL || 'http://127.0.0.1:3010/assistant';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local services only');
async function post(path, body) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  assert.ok(response.ok, `${path}: HTTP ${response.status}`);
  return response.json();
}
(async () => {
  const conversation = await post('/conversations', { tenantSlug: 'energrid', channel: 'web', visitorId: 'automated-estimator-smoke' });
  assert.ok(conversation.id, 'Conversation id missing');
  if (process.argv.includes('--house')) {
    for (const message of ['remont na selo','malka ku6ta s ve stai banq i kuhnq i koridor... iskam vsi4ko novo ... kakvo bihte preporu4ali?']) {
      const r=await post(`/conversations/${conversation.id}/messages`,{message});
      assert.doesNotMatch(r.reply,/5 стаи|пет стаи|EUR/);
      assert.match(r.reply,/Колко жилищни стаи/);
      console.log(message+'\n'+r.reply);
    }
    const clarified=await post(`/conversations/${conversation.id}/messages`,{message:'Dve stai sa, banq, otdelna kuhnq i koridor'});
    assert.match(clarified.reply,/2 стаи/);
    assert.match(clarified.reply,/5 осветителни извода/);
    const range=clarified.reply.match(/\d+\.\d{2}–\d+\.\d{2} EUR/)[0];
    const priced=await post(`/conversations/${conversation.id}/messages`,{message:'Da de no mi trqbva orientirovu4na cena za da znam dali da vi vzema vas'});
    assert.ok(priced.reply.includes(range));
    assert.doesNotMatch(priced.reply,/насрочим оглед/);
    console.log(priced.reply+'\nPASS: ambiguous house layout clarified; catalog price retained.',conversation.id);
    return;
  }
  if (process.argv.includes('--questions')) {
    await post(`/conversations/${conversation.id}/messages`, {message:'Remont4e si pravq vuv moq dvustaen panelen apartament'});
    const quote=await post(`/conversations/${conversation.id}/messages`,{message:'Iskam boiler, pe4ka, peralnq i su6ilnq i dva klimatika. Svetlinite i kontaktite obiknoveni.'});
    assert.match(quote.reply,/сушилня/);
    const range=quote.reply.match(/\d+\.\d{2}–\d+\.\d{2} EUR/)[0];
    for(const [message,expected] of [['Umno rele, tova za kakvo e',/нормалните ключове/],['Da... oba4e ne6to ne mi e qsno... trqbva li da se kurtqt stenite ?',/Не непременно/]]) {
      const result=await post(`/conversations/${conversation.id}/messages`,{message});
      assert.match(result.reply,expected); assert.doesNotMatch(result.reply,/Ето разбивката/);
      console.log(message+'\n'+result.reply);
    }
    const detail=await post(`/conversations/${conversation.id}/messages`,{message:'pokaji razbivkata'});
    assert.ok(detail.reply.includes(range),'Information questions changed the price');
    assert.doesNotMatch(detail.reply,/Умни релета: 1/);
    console.log('PASS: information questions preserve price and do not add relays.',conversation.id);
    return;
  }
  if (process.argv.includes('--followups')) {
    for (const [message, expected] of [
      ['Remont na 3staen apartament', /EUR само за труд/],
      ['Moje da... kakvo ozna4ava to4ka', /Монтажът на контакта/],
      ['Ami bu6onite? Tabloto?', /таблото е включено/],
      ['Da', /Изводи:/],
      ['Imate li cenorazpis nqkude ?', /активния каталог/],
    ]) {
      const result = await post(`/conversations/${conversation.id}/messages`, { message });
      assert.match(result.reply, expected);
      assert.doesNotMatch(result.reply, /нямаме.*ценови|насрочим оглед/i);
      console.log(`${message}\n${result.reply}\n`);
    }
    console.log('PASS: point, panel, accepted breakdown and price list.', conversation.id);
    return;
  }
  let previousRange;
  for (const message of ['Remont v 3 staen apartament', 'Da, 4 klimatika', 'GOre doulu÷', 'pokaji razbivkata']) {
    const result = await post(`/conversations/${conversation.id}/messages`, { message });
    assert.equal(typeof result.reply, 'string');
    assert.doesNotMatch(result.reply, /временно.*недостъп|възникна проблем/i);
    const range = result.reply.match(/(\d+\.\d{2})[–-](\d+\.\d{2}) EUR/);
    assert.ok(range, 'Expected a calculated price range, not an inspection deflection');
    assert.match(result.reply, /труд/);
    if (message === 'GOre doulu÷' || message === 'pokaji razbivkata') assert.equal(range[0], previousRange);
    if (message === 'pokaji razbivkata') assert.match(result.reply, /климатици × 4/);
    else assert.ok(result.reply.length < 1000);
    previousRange = range[0];
    console.log(`${message}\n${result.reply}\n`);
  }
  console.log('PASS: end-to-end conversation. Synthetic record:', conversation.id);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
