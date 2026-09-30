import {
  emptyPilot,
  transition,
  renderReply,
  writingContext,
  discardUnchangedFacts,
  resolveAcknowledgement,
  breakdownReply,
  unpricedEquipment,
  priceReferences,
} from './pilot-state';
test('completed socket example uses catalogue prices and is not a light-fitting rate', () => {
  const rows = [
    {
      code: 'power_point_up_to_3m',
      base_price: 20,
      unit: 'точка',
      labor_included: true,
      materials_included: false,
    },
    {
      code: 'socket_or_switch_concealed',
      base_price: 10,
      unit: 'бр.',
      labor_included: true,
      materials_included: false,
    },
  ];
  expect(priceReferences(emptyPilot(), rows)['example.completed_socket']).toBe(
    '30.00 EUR',
  );
  rows[0].base_price = 25;
  expect(priceReferences(emptyPilot(), rows)['example.completed_socket']).toBe(
    '35.00 EUR',
  );
  expect(
    writingContext(emptyPilot(), rows).pricingExplanation.lightFitting,
  ).toContain('excluded');
});
test('breakdown acknowledgement displays the saved lines without accepting or recalculating', async () => {
  const state = emptyPilot();
  state.active = {
    facts: { roomCount: 3 },
    template: {},
    calculatedAt: 'fixed',
    estimate: {
      min: 810,
      max: 1650,
      currency: 'EUR',
      assumptions: [],
      lines: [
        {
          code: 'socket_or_switch_concealed',
          label: 'Монтаж: 14 контакта и 6 обикновени ключа',
          quantity: 20,
          min: 200,
          max: 200,
        },
      ],
    },
  };
  state.pending = 'breakdown';
  const decision = resolveAcknowledgement(state, {
    action: 'accept',
    topic: 'okay',
    changes: [],
  });
  expect(decision.action).toBe('breakdown');
  const calculator = jest.fn();
  const next = await transition(state, decision, 'DObre', 'id', calculator);
  expect(next.active).toEqual(state.active);
  expect(next.pending).toBeNull();
  expect(calculator).not.toHaveBeenCalled();
  expect(breakdownReply(next)).toContain('14 контакта и 6 обикновени ключа');
  expect(breakdownReply(next)).not.toContain('20 ключа');
  expect(
    resolveAcknowledgement(next, {
      action: 'accept',
      topic: 'Davai',
      changes: [],
    }).action,
  ).toBe('breakdown');
});
test('future equipment is preserved as unpriced facts rather than extra standard points', async () => {
  const calculator = jest.fn(async (facts: any) => ({
    facts,
    template: {},
    calculatedAt: 'fixed',
    estimate: null,
  }));
  const state = await transition(
    emptyPilot(),
    {
      action: 'update',
      topic: 'future',
      changes: [
        { field: 'heatPumpPlan', value: 'future', evidence: 'termo pompa' },
        { field: 'evChargerPlan', value: 'future', evidence: 'EV' },
      ],
    },
    'v budeshte termo pompa i EV',
    'id',
    calculator,
  );
  expect(unpricedEquipment(state.facts)).toEqual([
    'термопомпата',
    'зарядната станция',
  ]);
  expect(state.facts).not.toHaveProperty('acCount');
  expect(state.facts).not.toHaveProperty('socketCount');
});
test('repeated known facts are discarded without weakening new-fact evidence', () => {
  const state = emptyPilot();
  state.facts.propertyType = 'studio';
  const result = discardUnchangedFacts(state, {
    action: 'compare',
    topic: 'two relays',
    changes: [
      { field: 'propertyType', value: 'studio', evidence: 'old message' },
      { field: 'smartRelayCount', value: '2', evidence: '2 relays' },
    ],
  });
  expect(result.changes).toEqual([
    { field: 'smartRelayCount', value: '2', evidence: '2 relays' },
  ]);
  expect(result.action).toBe('compare');
  expect(
    discardUnchangedFacts(state, {
      action: 'update',
      topic: 'same',
      changes: [{ field: 'propertyType', value: 'studio', evidence: 'old' }],
    }).action,
  ).toBe('read');
});
const calculate = jest.fn(async (facts: any) => ({
  facts,
  template: { version: 'fixture' },
  calculatedAt: 'fixed',
  estimate: {
    min: 100 + (facts.smartRelayCount ?? 0) * 25,
    max: 200 + (facts.smartRelayCount ?? 0) * 25,
    currency: 'EUR',
    lines: [],
    assumptions: [],
  },
}));
const initial = async () =>
  transition(
    emptyPilot(),
    {
      action: 'update',
      topic: 'studio',
      changes: [
        { field: 'propertyType', value: 'studio', evidence: 'garsionera' },
      ],
    },
    'nova garsionera',
    'm1',
    calculate,
  );
beforeEach(() => calculate.mockClear());
test('read is pure even if catalog prices changed', async () => {
  const state = await initial();
  calculate.mockClear();
  const result = await transition(
    state,
    { action: 'read', topic: 'relay', changes: [] },
    'what is a relay',
    'm2',
    calculate,
  );
  expect(result).toEqual(state);
  expect(calculate).not.toHaveBeenCalled();
  await expect(
    transition(
      state,
      {
        action: 'read',
        topic: 'relay',
        changes: [{ field: 'smartRelayCount', value: '1', evidence: 'relay' }],
      },
      'relay',
      'm3',
      calculate,
    ),
  ).rejects.toThrow();
});
test('comparison does not mutate active quote; accept applies once', async () => {
  const state = await initial();
  const comparison = await transition(
    state,
    {
      action: 'compare',
      topic: 'relay',
      changes: [
        { field: 'smartRelayCount', value: '2', evidence: 'two relays' },
      ],
    },
    'what about two relays',
    'm2',
    calculate,
  );
  expect(comparison.active).toEqual(state.active);
  expect(comparison.facts).toEqual(state.facts);
  expect(comparison.candidate?.snapshot.estimate?.min).toBe(150);
  const accepted = await transition(
    comparison,
    { action: 'accept', topic: 'yes', changes: [] },
    'yes',
    'm3',
    calculate,
  );
  expect(accepted.facts.smartRelayCount).toBe(2);
  expect(accepted.revision).toBe(2);
  await expect(
    transition(
      accepted,
      { action: 'accept', topic: 'again', changes: [] },
      'yes',
      'm4',
      calculate,
    ),
  ).rejects.toThrow();
});
test('new correction invalidates stale comparison', async () => {
  let state = await initial();
  state = await transition(
    state,
    {
      action: 'compare',
      topic: 'x',
      changes: [{ field: 'smartRelayCount', value: '2', evidence: 'two' }],
    },
    'two',
    'm2',
    calculate,
  );
  state = await transition(
    state,
    {
      action: 'update',
      topic: 'x',
      changes: [{ field: 'acCount', value: '4', evidence: 'four' }],
    },
    'four',
    'm3',
    calculate,
  );
  expect(state.candidate).toBeNull();
  await expect(
    transition(
      state,
      { action: 'accept', topic: 'x', changes: [] },
      'yes',
      'm4',
      calculate,
    ),
  ).rejects.toThrow();
});
test('unsupported fields, invalid values and invented evidence are rejected', async () => {
  for (const change of [
    { field: 'min', value: '1', evidence: 'one' },
    { field: 'roomCount', value: '-2', evidence: 'one' },
    { field: 'hasBoiler', value: 'maybe', evidence: 'one' },
    { field: 'acCount', value: '2', evidence: 'invented' },
  ]) {
    await expect(
      transition(
        emptyPilot(),
        { action: 'update', topic: 'x', changes: [change] },
        'one',
        'm1',
        calculate,
      ),
    ).rejects.toThrow();
  }
});
test('monetary output resolves only verified references', () => {
  expect(
    renderReply('{{catalog.point}} на точка', {
      'catalog.point': '20.00 EUR/точка',
    }),
  ).toBe('20.00 EUR/точка');
  expect(
    renderReply('Около {{active.total}}.', { 'active.total': '100–200 EUR' }),
  ).toBe('Около 100–200 EUR.');
  expect(() => renderReply('200 EUR', {})).toThrow();
  expect(() => renderReply('{{invented}}', {})).toThrow();
});
test('explicit AC count corrects an earlier absence', async () => {
  const state = await initial();
  state.facts.hasAc = false;
  const changed = await transition(
    state,
    {
      action: 'update',
      topic: 'AC',
      changes: [{ field: 'acCount', value: '2', evidence: '2 klimatika' }],
    },
    'imam 2 klimatika',
    'm2',
    calculate,
  );
  expect(changed.facts).toMatchObject({ acCount: 2, hasAc: true });
});
test('writer receives named price handles without raw monetary amounts', async () => {
  const state = await initial();
  const context = writingContext(state, [
    { code: 'panel_modern', name_bg: 'Табло', base_price: 50, unit: 'бр.' },
  ]);
  expect(context.active?.estimate?.total).toBe('{{active.total}}');
  expect(context.active?.estimate).not.toHaveProperty('min');
  expect(context.catalog[0]).toMatchObject({
    label: 'Табло',
    price: '{{catalog.panel_modern}}',
  });
  expect(context.catalog[0]).not.toHaveProperty('base_price');
  expect(
    renderReply('{{active.total}} EUR', { 'active.total': '100–200 EUR' }),
  ).toBe('100–200 EUR');
});
