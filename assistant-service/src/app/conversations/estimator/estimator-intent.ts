export interface EstimatorIntentSignal {
  shouldHandle: boolean;
  reasons: string[];
  normalizedText: string;
}

function hasAny(text: string, values: string[]): boolean {
  return values.some((x) => text.includes(x));
}

export function normalizeEstimatorText(input: string): string {
  let text = input.toLowerCase().trim();

  const replacements: Array<[RegExp, string]> = [
    [/6/g, 'ш'],
    [/4/g, 'ч'],
    [/q/g, 'я'],
    [/x/g, 'ж'],

    [/cena/g, 'цена'],
    [/oferta/g, 'оферта'],
    [/trqbva/g, 'трябва'],
    [/iskam/g, 'искам'],
    [/ami/g, 'ами'],
    [/remont/g, 'ремонт'],
    [/obiknoven+i/g, 'обикновени'],
    [/obiknoven/g, 'обикновен'],
    [/garsionera/g, 'гарсониера'],
    [/garsoniera/g, 'гарсониера'],

    [/to4ki/g, 'точки'],
    [/tochki/g, 'точки'],
    [/to4ka/g, 'точка'],
    [/tochka/g, 'точка'],

    [/kontakti/g, 'контакти'],
    [/kontakt/g, 'контакт'],
    [/kontact/g, 'контакт'],

    [/kluchove/g, 'ключове'],
    [/kluch/g, 'ключ'],

    [/osvetlenie/g, 'осветление'],
    [/tabl[o0]/g, 'табло'],
    [/trifazen/g, 'трифазен'],

    [/instalaciya/g, 'инсталация'],
    [/instalaciq/g, 'инсталация'],
    [/instalciya/g, 'инсталация'],
    [/instalciq/g, 'инсталация'],

    [/orientirovachna/g, 'ориентировъчна'],
    [/orientirovuchna/g, 'ориентировъчна'],
    [/orientirovachno/g, 'ориентировъчно'],
  ];

  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }

  return text.replace(/\s+/g, ' ').trim();
}

export function isEstimatorMetaQuestion(text: string): boolean {
  return hasAny(text, [
    'как пресмят',
    'как изчисля',
    'как смят',
    'защо',
    'каква е логиката',
    'как работи',
    'как се формира',
    'как се образува',
    'от какво зависи',
    'защо е толкова',
    'как определяте',
    'как я сметнахте',
    'как сте го сметнали',
    'kak presm',
    'kak izchisl',
    'zasho',
    'ot kakvo zavisi',
  ]);
}

export function detectEstimatorIntent(
  estimatorEnabled: boolean,
  message: string,
  hasExistingDraft: boolean,
): EstimatorIntentSignal {
  const text = normalizeEstimatorText(message);
  const reasons: string[] = [];

  if (!estimatorEnabled) {
    return {
      shouldHandle: false,
      reasons: ['estimator_disabled'],
      normalizedText: text,
    };
  }

  if (hasExistingDraft) {
    reasons.push('existing_draft');
    return {
      shouldHandle: true,
      reasons,
      normalizedText: text,
    };
  }

  const hasPriceIntent = hasAny(text, [
    'цена',
    'колко струва',
    'оферта',
    'ориентировъчно',
    'ориентировъчна',
    'estimate',
    'price',
    'cost',
    'quote',
  ]);

  const hasElectricalItems = hasAny(text, [
    'точк',
    'контакт',
    'контакти',
    'розет',
    'ключ',
    'ключове',
    'освет',
    'ламп',
    'табло',
    'трифаз',
    'вентилатор',
    'датчик',
    'бойлерно табло',
  ]);

  const hasNumber = /\b\d+(?:[.,]\d+)?\b/.test(text);
  const hasIndefiniteQuantity = hasAny(text, [
    'няколко',
    'няколко контакта',
    'няколко точки',
    'няколко ключа',
  ]);

  if (hasPriceIntent) reasons.push('price_intent');
  if (hasElectricalItems) reasons.push('electrical_item');
  if (hasNumber) reasons.push('number');
  if (hasIndefiniteQuantity) reasons.push('indefinite_quantity');

  const shouldHandle =
    hasPriceIntent ||
    (hasElectricalItems && hasNumber) ||
    (hasElectricalItems && hasIndefiniteQuantity);

  return {
    shouldHandle,
    reasons,
    normalizedText: text,
  };
}
