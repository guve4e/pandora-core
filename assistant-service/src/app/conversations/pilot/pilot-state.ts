import { BadRequestException, ConflictException } from '@nestjs/common';

export interface Snapshot {
  facts: Record<string, any>;
  estimate: null | {
    min: number;
    max: number;
    currency: string;
    lines: any[];
    assumptions: string[];
  };
  template: unknown;
  calculatedAt: string;
  circuits?: unknown;
}
export interface PilotState {
  version: 1;
  revision: number;
  facts: Record<string, any>;
  evidence: Record<string, { messageId: string; quote: string }>;
  active: Snapshot | null;
  candidate: {
    baseRevision: number;
    snapshot: Snapshot;
    evidence: PilotState['evidence'];
  } | null;
  pending: 'breakdown' | 'candidate' | null;
}
export const emptyPilot = (): PilotState => ({
  version: 1,
  revision: 0,
  facts: {},
  evidence: {},
  active: null,
  candidate: null,
  pending: null,
});
export interface Decision {
  action: 'read' | 'update' | 'compare' | 'accept' | 'clarify' | 'breakdown';
  topic: string;
  changes: Array<{ field: string; value: string; evidence: string }>;
}
export const numbers = [
  'roomCount',
  'areaSqm',
  'corridorCount',
  'bathroomCount',
  'terraceCount',
  'socketCount',
  'lightingPointCount',
  'smartRelayCount',
  'acCount',
];
export const booleans = [
  'separateKitchen',
  'hasBoiler',
  'hasAc',
  'hasCooker',
  'hasOven',
  'hasHob',
  'hasWashingMachine',
  'hasDryer',
  'hasDishwasher',
];
export const enums: Record<string, string[]> = {
  propertyType: ['studio', 'apartment', 'house'],
  buildingStage: ['new', 'renovation'],
  wallType: ['brick', 'concrete', 'none'],
  panelKind: ['panel_modern', 'panel_full_protection', 'panel_custom'],
  heatPumpPlan: ['future', 'now', 'none'],
  evChargerPlan: ['future', 'now', 'none'],
};
export const fields = [...numbers, ...booleans, ...Object.keys(enums)];

export function resolveAcknowledgement(
  state: PilotState,
  decision: Decision,
): Decision {
  if (
    decision.action === 'accept' &&
    (state.pending === 'breakdown' ||
      (!state.candidate && state.active?.estimate))
  )
    return { ...decision, action: 'breakdown', changes: [] };
  if (decision.action === 'accept' && !state.candidate)
    return { ...decision, action: 'clarify', changes: [] };
  return decision;
}

export function breakdownReply(state: PilotState) {
  if (!state.active?.estimate)
    return 'Колко жилищни стаи има, отделно от кухнята, банята и коридора?';
  return `Ето разбивката — {{active.total}} само за труд:\n\n${state.active.estimate.lines.map((line, i) => `• ${line.label}: {{active.line${i}}}`).join('\n')}\n\nКоличествата, които не сте уточнили, са начални допускания. Материалите, монтажът на уреди и осветителни тела, демонтажът и възстановяването на стените са отделно. ${state.active.estimate.lines.some((line) => String(line.code).startsWith('chasing_')) ? 'Къртенето е включено по предполагаеми трасета.' : 'Къртенето не е включено.'} Трудът по таблото не е цена за самите защитни устройства.`;
}

export function unpricedEquipment(facts: Record<string, any>) {
  return [
    ['heatPumpPlan', 'термопомпата'],
    ['evChargerPlan', 'зарядната станция'],
  ]
    .filter(([key]) => ['future', 'now'].includes(facts[key]))
    .map(([, label]) => label);
}

export function discardUnchangedFacts(
  state: PilotState,
  decision: Decision,
): Decision {
  if (!['update', 'compare'].includes(decision.action)) return decision;
  const changes = decision.changes.filter(
    (change) =>
      state.facts[change.field] === undefined ||
      String(state.facts[change.field]) !== change.value,
  );
  return {
    ...decision,
    changes,
    action: changes.length ? decision.action : 'read',
  };
}

export async function transition(
  state: PilotState,
  decision: Decision,
  message: string,
  messageId: string,
  calculate: (facts: Record<string, any>) => Promise<Snapshot>,
): Promise<PilotState> {
  const next = structuredClone(state);
  if (
    !['read', 'clarify', 'update', 'compare', 'accept', 'breakdown'].includes(
      decision.action,
    )
  )
    throw new BadRequestException('Unknown action');
  if (
    ['read', 'clarify', 'accept', 'breakdown'].includes(decision.action) &&
    decision.changes.length
  )
    throw new BadRequestException('Read/accept cannot contain changes');
  if (decision.action === 'read' || decision.action === 'clarify') return next;
  if (decision.action === 'breakdown') {
    next.pending = null;
    return next;
  }
  if (decision.action === 'accept') {
    if (state.pending === 'breakdown') {
      next.pending = null;
      return next;
    }
    if (
      !state.candidate ||
      state.pending !== 'candidate' ||
      state.candidate.baseRevision !== state.revision
    )
      throw new ConflictException('No current proposal to accept');
    next.active = structuredClone(state.candidate.snapshot);
    next.facts = structuredClone(state.candidate.snapshot.facts);
    next.evidence = structuredClone(state.candidate.evidence);
    next.candidate = null;
    next.pending = null;
    next.revision++;
    return next;
  }
  if (!decision.changes.length)
    throw new BadRequestException('No requested changes');
  const facts = { ...state.facts };
  const evidence = { ...state.evidence };
  for (const change of decision.changes) {
    if (
      !fields.includes(change.field) ||
      !change.evidence.trim() ||
      !message.toLowerCase().includes(change.evidence.toLowerCase())
    )
      throw new BadRequestException(
        'Unsupported change or missing customer evidence',
      );
    let value: unknown = change.value;
    if (numbers.includes(change.field)) {
      value = Number(change.value);
      if (
        !change.value.trim() ||
        !Number.isFinite(value) ||
        Number(value) < 0 ||
        Number(value) > 10000 ||
        (change.field !== 'areaSqm' && !Number.isInteger(value))
      )
        throw new BadRequestException('Invalid quantity');
    } else if (booleans.includes(change.field)) {
      if (!['true', 'false'].includes(change.value))
        throw new BadRequestException('Invalid boolean');
      value = change.value === 'true';
    } else if (!enums[change.field].includes(change.value))
      throw new BadRequestException('Invalid option');
    facts[change.field] = value;
    evidence[change.field] = { messageId, quote: change.evidence };
  }
  const acChange = decision.changes.find(
    (change) => change.field === 'acCount',
  );
  const acPresence = decision.changes.find(
    (change) => change.field === 'hasAc',
  );
  if (acChange && Number(acChange.value) > 0 && acPresence?.value === 'false')
    throw new BadRequestException('Conflicting air-conditioner facts');
  if (acChange && !acPresence) {
    facts.hasAc = Number(acChange.value) > 0;
    evidence.hasAc = { messageId, quote: acChange.evidence };
  }
  if (facts.hasAc === false) delete facts.acCount;
  const snapshot = await calculate(facts);
  // Facts remain customer supplied. Template defaults live only inside the snapshot.
  snapshot.facts = {
    ...facts,
    templateVersion: snapshot.facts.templateVersion,
  };
  if (decision.action === 'compare') {
    next.candidate = { baseRevision: state.revision, snapshot, evidence };
    next.pending = 'candidate';
  } else {
    next.facts = snapshot.facts;
    next.evidence = evidence;
    next.active = snapshot;
    next.candidate = null;
    next.pending = null;
    next.revision++;
  }
  return next;
}

export function priceReferences(state: PilotState, catalog: any[]) {
  const refs: Record<string, string> = {};
  for (const [key, snapshot] of [
    ['active', state.active],
    ['candidate', state.candidate?.snapshot],
  ] as const) {
    if (!snapshot?.estimate) continue;
    refs[`${key}.total`] =
      `${snapshot.estimate.min.toFixed(2)}–${snapshot.estimate.max.toFixed(2)} EUR`;
    snapshot.estimate.lines.forEach((line, i) => {
      refs[`${key}.line${i}`] =
        line.min === line.max
          ? `${line.min.toFixed(2)} EUR`
          : `${line.min.toFixed(2)}–${line.max.toFixed(2)} EUR`;
    });
  }
  for (const row of catalog)
    if (Number.isFinite(Number(row.base_price)))
      refs[`catalog.${row.code}`] =
        `${Number(row.base_price).toFixed(2)} EUR/${row.unit}`;
  const socketParts = [
    'power_point_up_to_3m',
    'socket_or_switch_concealed',
  ].map((code) => catalog.find((row) => row.code === code));
  if (
    socketParts.every(
      (row) =>
        row &&
        row.labor_included &&
        !row.materials_included &&
        Number.isFinite(Number(row.base_price)),
    )
  ) {
    refs['example.completed_socket'] =
      `${socketParts.reduce((sum, row) => sum + Number(row.base_price), 0).toFixed(2)} EUR`;
  }
  return refs;
}

// The writer gets price handles, not raw money that it could copy or recompute.
export function writingContext(state: PilotState, catalog: any[]) {
  const snapshot = (value: Snapshot | null | undefined, key: string) =>
    value
      ? {
          facts: value.facts,
          calculatedAt: value.calculatedAt,
          estimate: value.estimate
            ? {
                total: `{{${key}.total}}`,
                assumptions: value.estimate.assumptions,
                lines: value.estimate.lines.map((line, i) => ({
                  code: line.code,
                  label: line.label,
                  // This catalogue row combines sockets AND switches. Its total
                  // must not be presented as the number of switches.
                  quantity:
                    line.code === 'socket_or_switch_concealed'
                      ? undefined
                      : line.quantity,
                  unit: line.unit,
                  price: `{{${key}.line${i}}}`,
                })),
              }
            : null,
        }
      : null;
  return {
    facts: state.facts,
    pricingExplanation: {
      point:
        'power_point_up_to_3m covers creating a supply point with a route up to 3 m, whether for a socket or light outlet.',
      socketMount:
        'socket_or_switch_concealed is mounting the socket or switch, separate from creating its supply point.',
      combinedSocketExample:
        'When both items apply, use {{example.completed_socket}} for one new socket point plus mounting its socket, within the included route allowance, labour only.',
      lightFitting:
        'A lighting supply point is not installing the light fitting itself. Fitting installation is excluded; never reuse the socket/switch mounting rate as a light-fitting price.',
    },
    unpricedEquipment: unpricedEquipment(state.facts),
    pending: state.pending,
    active: snapshot(state.active, 'active'),
    candidate: snapshot(state.candidate?.snapshot, 'candidate'),
    catalog: catalog.map((row) => ({
      code: row.code,
      label: row.name_bg ?? row.label ?? row.name ?? row.description,
      unit: row.unit,
      price: `{{catalog.${row.code}}}`,
      labor_included: row.labor_included,
      materials_included: row.materials_included,
    })),
  };
}

export function renderReply(text: string, refs: Record<string, string>) {
  // Monetary figures must be server-resolved references, not model arithmetic.
  const withoutRefs = text.replace(/\{\{([^{}]+)\}\}/g, '');
  if (
    /(?:\d[\d.,\s–-]*\s*(?:EUR|евро|€|лева|лв|euro)|(?:EUR|€)\s*\d)/i.test(
      withoutRefs,
    )
  )
    throw new BadRequestException('Ungrounded monetary value');
  return text
    .replace(/\{\{([^{}]+)\}\}(?:\s*(?:EUR|евро|€))?/gi, (_, key) => {
      if (!(key in refs))
        throw new BadRequestException('Unknown price reference');
      return refs[key];
    })
    .replace(/(EUR\/точка)\s+на точка/g, '$1')
    .replace(/(EUR\/л\.м\.)\s+на л\.м\./g, '$1')
    .replace(/(EUR\/бр\.)\s+на брой/g, '$1');
}
