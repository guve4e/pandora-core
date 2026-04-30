import type { EstimatorPreviewSummary } from '../conversation-meta.types';

export interface EstimateFollowupIntentResult {
  matched: boolean;
  key?:
    | 'why_expensive'
    | 'how_priced'
    | 'materials_included'
    | 'can_be_cheaper'
    | 'inspection_why';
}

function normalizeText(input: string): string {
  let text = input.toLowerCase().trim();

  const replacements: Array<[RegExp, string]> = [
    [/6/g, 'ш'],
    [/4/g, 'ч'],
    [/q/g, 'я'],
    [/x/g, 'ж'],

    [/zashto/g, 'защо'],
    [/skupo/g, 'скъпо'],
    [/skupo li e/g, 'скъпо ли е'],
    [/kak/g, 'как'],
    [/presmqtate/g, 'пресмятате'],
    [/presmqta/g, 'пресмята'],
    [/presmetnate/g, 'пресметнате'],
    [/cena/g, 'цена'],
    [/cenata/g, 'цената'],
    [/materiali/g, 'материали'],
    [/vkliu4eni/g, 'включени'],
    [/vklu4eni/g, 'включени'],
    [/evtino/g, 'евтино'],
    [/po-evtino/g, 'по-евтино'],
    [/ogled/g, 'оглед'],
  ];

  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }

  return text.replace(/\s+/g, ' ').trim();
}

function hasAny(text: string, values: string[]): boolean {
  return values.some((x) => text.includes(x));
}

export function detectEstimateFollowupIntent(input: {
  message: string;
  lastPreview?: EstimatorPreviewSummary | null;
}): EstimateFollowupIntentResult {
  if (!input.lastPreview) {
    return { matched: false };
  }

  const text = normalizeText(input.message);

  if (
    hasAny(text, [
      'защо е толкова скъпо',
      'защо толкова скъпо',
      'защо е скъпо',
      'скъпо ми се вижда',
      'много скъпо',
      'why expensive',
    ])
  ) {
    return { matched: true, key: 'why_expensive' };
  }

  if (
    hasAny(text, [
      'как пресмятате',
      'как е сметнато',
      'как е изчислено',
      'как смятате',
      'от къде идва тази цена',
      'как формирате цената',
      'how priced',
    ])
  ) {
    return { matched: true, key: 'how_priced' };
  }

  if (
    hasAny(text, [
      'материалите включени ли са',
      'включени ли са материалите',
      'има ли материали',
      'materials included',
    ])
  ) {
    return { matched: true, key: 'materials_included' };
  }

  if (
    hasAny(text, [
      'може ли по-евтино',
      'може ли по евтино',
      'може ли по ниско',
      'може ли да падне',
      'can be cheaper',
      'по-евтино',
    ])
  ) {
    return { matched: true, key: 'can_be_cheaper' };
  }

  if (
    hasAny(text, [
      'защо трябва оглед',
      'защо е нужен оглед',
      'защо оглед',
      'inspection why',
    ])
  ) {
    return { matched: true, key: 'inspection_why' };
  }

  return { matched: false };
}
