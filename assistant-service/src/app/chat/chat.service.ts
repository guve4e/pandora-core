import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { AssistantChatInput } from '../ai/ai.types';
import { AssistantConfigService } from '../assistant-config/assistant-config.service';
import type { ConversationMeta } from '../conversations/conversation-meta.types';

export type ChatServiceResult =
  | {
      type: 'assistant_reply';
      reply: string;
      model: string | null;
      tokensInput: number | null;
      tokensOutput: number | null;
      meta?: Record<string, unknown>;
    }
  | {
      type: 'call_estimator';
      toolInput: {
        message: string;
      };
      model: string | null;
      tokensInput: number | null;
      tokensOutput: number | null;
      meta?: Record<string, unknown>;
    };

function hasAny(text: string, values: string[]): boolean {
  return values.some((x) => text.includes(x));
}

export function shouldForceEstimatorRoute(input: {
  message: string;
  estimatorEnabled: boolean;
  hasDraft: boolean;
  customerHistory?: string[];
}): boolean {
  if (!input.estimatorEnabled) {
    return false;
  }

  const text = input.message.toLowerCase().trim();
  const dwelling = /къщ|ku[6s]t|kasht|house|село|selo|апартамент|apartament|гарсониер|garsioner|garsonier/;
  const renovation = /ремонт|remont|инсталац|instalaci|всичко ново|vsi[4c]h?ko novo/;
  const priceQuestion = /цена|cena|струва|struva|ориентир|orientir|колко.*пари|kolko.*pari/;
  if (dwelling.test(text) && renovation.test(text)) return true;
  const history = (input.customerHistory ?? []).slice(-12).join(' ').toLowerCase();
  if (priceQuestion.test(text) && (input.hasDraft || (dwelling.test(history) && renovation.test(history)))) return true;
  if (input.hasDraft && /умно.*реле|umno.*rele|кърт|kurt|стен|sten/.test(text)) return true;
  if (input.hasDraft && /ценора[зс]пис|cenorazpis|cenoraspis|price list|kakvo.*to[4c]ka|ozna[4c]ava.*to[4c]ka|какво.*точка|бушон|bu[6s]on|кръгов|krugov|схема|shema|^(да|da|yes|може|moje)(\s|[.!?,]|$)/.test(text)) return true;
  const home = /гарсониер|gar[si]*onier|garsonier|garsioner|апартамент|apartament|aprtament|жилищ|тристаен|двустаен|[234]\s*[- ]?стаен|[234]\s*[- ]?staen|tristaen|dvustaen/.test(text);
  if (input.hasDraft && /коридор|koridor|баня|banq|кухня|kiuhnq|kuhnq|тераса|terasa/.test(text)) return true;
  const roughPrice = /горе\s*[ -]?долу|gore\s*d[oou]+l[uou]*|приблизител|priblizitel|колко пари|kolko pari|cena|цена/.test(text);
  if (home && /ремонт|remont|инсталац|instalaci|цена|cena/.test(text)) return true;
  if (input.hasDraft && (roughPrice || /разбив|razbiv|детайл|detail|защо|zashto|za kakvo|материал|material|включ|vkl|без |bez |shelly/.test(text))) return true;
  const hasNumber = /\b\d+(?:[.,]\d+)?\b/.test(text);

  const priceIntentSignals = [
    'цена',
    'cena',
    'оферта',
    'oferta',
    'колко струва',
    'kolko struva',
    'estimate',
    'price',
    'quote',
  ];

  const electricalScopeSignals = [
    'контакт',
    'контакти',
    'ключ',
    'ключове',
    'осветление',
    'точка',
    'точки',
    'табло',
    'бойлер',
    'кабел',
    'метра',
    'печка',
    'климатик',
    'kontakt',
    'kontakti',
    'kluch',
    'tochka',
    'tochki',
    'tablo',
    'boiler',
    'kabel',
    'metra',
    'pechka',
    'pe4ka',
    'klimatik',
  ];

  const explanationSignals = [
    'как го смет',
    'как е смет',
    'обясни цената',
    'защо е толкова',
    'kak go smet',
    'kak e smet',
    'obqsni cenata',
    'zashto e tolkova',
    'how did you calculate',
    'explain the estimate',
  ];

  const hasPriceIntent = hasAny(text, priceIntentSignals);
  const hasElectricalScope = hasAny(text, electricalScopeSignals);

  if (hasAny(text, explanationSignals) && input.hasDraft) {
    return true;
  }

  if (hasPriceIntent && hasElectricalScope) {
    return true;
  }

  if (hasElectricalScope && (hasNumber || input.hasDraft)) {
    return true;
  }

  return false;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly ai: AiService,
    private readonly assistantConfig: AssistantConfigService,
  ) {}

  async chat(
    input: AssistantChatInput & {
      conversationMeta?: Record<string, unknown> | null;
    },
  ): Promise<ChatServiceResult> {
    const profile = await this.assistantConfig.getTenantProfile(
      input.tenantSlug,
    );
    const meta = (input.conversationMeta ?? {}) as ConversationMeta;

    const estimatorEnabled = profile.features.estimatorEnabled;
    const hasDraft = Boolean(meta.estimator?.coreDraft);

    this.logger.log(
      `route check tenant=${input.tenantSlug} estimatorEnabled=${estimatorEnabled} hasDraft=${hasDraft}`,
    );

    const forcedEstimator = shouldForceEstimatorRoute({
      message: input.message,
      estimatorEnabled,
      hasDraft,
      customerHistory: input.history?.filter(turn => turn.role === 'user').map(turn => turn.text),
    });

    this.logger.log(
      `forced estimator decision tenant=${input.tenantSlug} forced=${forcedEstimator}`,
    );

    if (forcedEstimator) {
      this.logger.log(
        `forcing estimator route tenant=${input.tenantSlug}`,
      );

      return {
        type: 'call_estimator',
        toolInput: {
          message: input.message,
        },
        model: null,
        tokensInput: null,
        tokensOutput: null,
        meta: {
          provider: 'router',
          routingMode: 'forced_estimator_fallback',
        },
      };
    }

    this.logger.log(
      `falling back to ai routing tenant=${input.tenantSlug}`,
    );

    return this.ai.chatWithRouting(
      {
        ...input,
        estimatorContext: {
          enabled: profile.features.estimatorEnabled,
          stage: meta.estimator?.stage ?? null,
          hasDraft: Boolean(meta.estimator?.coreDraft),
          lastPreview: meta.estimator?.lastPreview ?? null,
        },
      },
      profile,
    );
  }
}
