import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { TenantDb } from '@org/backend-db';
import { ConversationsRepository } from '../conversations.repository';
import { AiUsageRepository } from '../ai-usage.repository';
import { getEnergridApiConfig, getAssistantGuardConfig } from '../../config';
import {
  PilotModelService,
  decisionSchema,
  replySchemaFor,
} from './pilot-model.service';
import {
  emptyPilot,
  transition,
  priceReferences,
  renderReply,
  writingContext,
  discardUnchangedFacts,
  resolveAcknowledgement,
  breakdownReply,
  unpricedEquipment,
  type PilotState,
  type Decision,
} from './pilot-state';

@Injectable()
export class PilotService {
  constructor(
    private readonly db: TenantDb,
    private readonly repo: ConversationsRepository,
    private readonly model: PilotModelService,
    private readonly usage: AiUsageRepository,
  ) {}
  private enabled() {
    if (process.env.ENERGRID_PILOT_ENABLED !== 'true')
      throw new NotFoundException();
  }
  private async core(path: string, facts?: unknown) {
    const response = await fetch(
      `${getEnergridApiConfig().baseUrl}/estimator/pilot/${path}`,
      {
        method: facts ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(facts ? { body: JSON.stringify({ facts }) } : {}),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      throw new ServiceUnavailableException(
        `Estimator unavailable (${response.status})`,
      );
    return response.json();
  }
  async create() {
    this.enabled();
    const row = await this.repo.createConversation({
      tenantSlug: 'energrid',
      channel: 'pilot',
      visitorId: 'energrid-residential-pilot',
    });
    await this.repo.updateMeta(row.id, {
      pilot: {
        mode: 'residential-v1',
        turnRevision: 0,
        state: emptyPilot(),
        receipts: [],
      },
    });
    return { id: row.id, turnRevision: 0 };
  }
  async turn(
    id: string,
    body: { message: string; turnId: string; expectedRevision: number },
  ) {
    this.enabled();
    if (
      typeof body?.message !== 'string' ||
      !body.message.trim() ||
      body.message.length > 2000 ||
      !/^[-a-zA-Z0-9]{1,80}$/.test(body.turnId ?? '') ||
      !Number.isInteger(body.expectedRevision) ||
      body.expectedRevision < 0
    )
      throw new BadRequestException('Invalid pilot turn');
    const conversation = await this.repo.findConversationById(id);
    const pilot = conversation?.meta?.pilot as any;
    if (
      !conversation ||
      conversation.tenant_slug !== 'energrid' ||
      pilot?.mode !== 'residential-v1'
    )
      throw new NotFoundException();
    const hash = createHash('sha256').update(body.message).digest('hex');
    const receipt = pilot.receipts.find((r: any) => r.id === body.turnId);
    if (receipt) {
      if (receipt.hash !== hash)
        throw new ConflictException('Turn ID reused for different input');
      return receipt.result;
    }
    if (pilot.turnRevision !== body.expectedRevision)
      throw new ConflictException(
        'Conversation changed; reload it before retrying',
      );
    const guard = getAssistantGuardConfig();
    if (
      guard.hardBlockWhenExceeded &&
      (await this.usage.getTodayUsage('energrid')).totalCostUsd >=
        guard.dailyTenantAiBudgetUsd
    )
      throw new ServiceUnavailableException('Daily AI budget reached');
    const history = (await this.repo.listMessages(id))
      .slice(-16)
      .map((row) => ({ role: row.role, text: row.message_text.slice(-3500) }));
    const state = pilot.state as PilotState;
    const usages: any[] = [];
    const record = async (usage: any) => {
      usages.push(usage);
      await this.usage.insertUsage({
        provider: 'openai',
        app: 'assistant',
        feature: 'residential_pilot',
        tenantSlug: 'energrid',
        conversationId: id,
        ...usage,
        meta: { turnId: body.turnId, step: usages.length },
      });
    };
    let decision: Decision = await this.model.json(
      `Extract every explicit residential fact from the latest customer message. An initial description of a studio, apartment or house IS an update even if phrased as a question. Include propertyType and all stated room/zone counts. Never require an area to record a dwelling type. Never infer a number of rooms from "small house". Asking whether quantities are flexible, such as whether the customer can choose as many sockets as needed, is read with no changes. "As many as I want" is not a number, and must never become socketCount. An actual requested count is an update. Record heatPumpPlan and evChargerPlan as future/now/none when mentioned. These are unpriced requirements, not ordinary appliance feeds.
Choose action by intent: accepting the pending proposal => accept; requesting a hypothetical alternative quantity/option or its price => compare; supplying actual project facts or requesting a change => update; explaining a concept, showing catalogue prices or answering a question with no new facts or alternative => read; unclear facts => clarify. "Do not add yet" means compare, NOT read, when an alternative quantity is supplied. A yes followed by a substantive question is read. Accept uses the saved candidate, no new patches.
Changes are absolute values, not increments, as strings. Include ALL supported facts explicitly stated now, never old facts from history. Evidence is latest_message and will be attached by the server. roomCount excludes kitchen, corridor, bathroom, terrace; use their separate fields. Studio means propertyType=studio. Do not invent area or room counts. Topic briefly describes the intent. Use breakdown when the customer asks to see the calculation, or agrees to a breakdown offer (including informal acknowledgements/typos). Breakdown only displays existing data, it does not accept a proposal. A repeated request to show it remains breakdown.`,
      { history, message: body.message, state },
      decisionSchema,
      record,
    );
    if (
      !Array.isArray(decision.changes) ||
      decision.changes.length > 30 ||
      typeof decision.topic !== 'string'
    )
      throw new BadRequestException('Invalid operation');
    // Repeated known facts are not changes and do not need new evidence or pricing.
    decision = discardUnchangedFacts(state, decision);
    decision = resolveAcknowledgement(state, decision);
    let next: PilotState;
    let rejectedUpdate = false;
    try {
      next = await transition(
        state,
        decision,
        body.message,
        body.turnId,
        (facts) => this.core('calculate', facts),
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Invalid model output is not a bad customer request. Keep every saved
        // fact and amount intact and let the writer answer/clarify the question.
        rejectedUpdate = true;
        decision = { action: 'read', topic: decision.topic, changes: [] };
        next = structuredClone(state);
      } else {
        if (process.env.ENERGRID_PILOT_DIAGNOSTICS === 'true')
          throw new BadRequestException({ message: String(error), decision });
        throw error;
      }
    }
    // Existing estimates are snapshots: read operations never recalculate them.
    const context = await this.core('context');
    context.template =
      (decision.action === 'compare'
        ? next.candidate?.snapshot.template
        : next.active?.template) ?? context.template;
    const refs = priceReferences(next, context.catalog);
    const writerContext = writingContext(next, context.catalog);
    const writerHistory = history.map((row) => ({
      ...row,
      text: row.text.replace(
        /\d[\d.,\s–-]*\s*(?:EUR|евро|€|лева|лв)/gi,
        '[предишна цена; използвайте актуалната препратка]',
      ),
    }));
    const composition =
      decision.action === 'breakdown'
        ? { reply: breakdownReply(next), offer: 'none' }
        : !next.active?.estimate && !next.candidate?.snapshot.estimate
          ? {
              reply:
                'Колко жилищни стаи има, отделно от кухнята, банята и коридора? Не е нужно да знаете квадратурата.',
              offer: 'none',
            }
          : await this.model.json(
              `Answer the latest question using the operation result and data. Do not decide new operations. Use education for clear explanations of protection and future equipment, distinguishing recommendations from priced scope. Never assume the panel price specifies one shared RCD or a number of protective devices. Never present heat pumps or EV chargers as included: their feeds, protections, preparation and installation are unpriced. Do not describe a combined socket-and-switch quantity as switches. If a calculation lacks an estimate ask only for the missing room count or dwelling type. State labour-only scope and important exclusions when quoting. Hypothetical candidate prices must be clearly labelled as alternatives, not applied. When a candidate exists you may offer to apply it; when asked for a breakdown show stored line descriptions and price references.
ALL monetary values must use exact placeholders from priceReferences, e.g. {{active.total}}, never literal prices or invented arithmetic. Placeholders already contain currency and units; do not append them. For estimate/update or comparison include its total placeholder if available. Other numbers (room/device counts) must agree with state. A price-list question needs catalogue rows with their catalogue price references, not another total or an offer to show prices later. A comparison must say it has not been applied and offer to apply it (offer=candidate). Other replies normally end with the answer, without a sales question. Give real concrete examples only when useful; never invent metaphors. Say quantities are initial assumptions when not confirmed. Do not copy technical jargon or lengthy assumptions verbatim. Keep ordinary replies under 700 characters unless a breakdown or price list is requested. offer is none unless the reply actually offers breakdown or acceptance of a candidate.`,
              {
                history: writerHistory,
                message: body.message,
                operation: decision.action,
                topic: decision.topic,
                state: writerContext,
                previousPending: state.pending,
                template: context.template,
                education: context.education,
                validationFeedback: rejectedUpdate
                  ? 'The proposed fact update was invalid and was NOT applied. Answer the actual question using unchanged facts. If an exact count is needed, ask for it; never invent a replacement count.'
                  : undefined,
                priceReferences: Object.keys(refs),
              },
              replySchemaFor(
                Boolean(next.active?.estimate),
                Boolean(next.candidate),
                decision.action === 'compare',
              ),
              record,
            );
    let reply: string;
    let validationIssue: string | undefined;
    try {
      if (
        typeof composition.reply !== 'string' ||
        composition.reply.length > 6000
      )
        throw new Error('Invalid reply');
      if (['update', 'compare'].includes(decision.action)) {
        const key =
          decision.action === 'compare' ? 'candidate.total' : 'active.total';
        if (refs[key] && !composition.reply.includes(`{{${key}}}`)) {
          composition.reply = `${decision.action === 'compare' ? 'За сравнение, без промяна в текущата сметка:' : 'Ориентирът е'} {{${key}}} само за труд.\n\n${composition.reply}`;
        }
      }
      reply = renderReply(composition.reply, refs);
      if (decision.action === 'compare')
        reply = `Това е сравнение; текущата сметка не е променена.\n\n${reply}\n\nДа приложа ли този вариант?`;
    } catch (error) {
      validationIssue = String(error);
      const key =
        decision.action === 'compare' ? 'candidate.total' : 'active.total';
      const quoting =
        ['update', 'compare', 'accept'].includes(decision.action) && refs[key];
      reply = quoting
        ? `Ориентирът ${decision.action === 'compare' ? 'за този вариант (не е добавен към текущата сметка) ' : ''}е ${refs[key]} само за изброения труд. Материалите и изключените дейности са отделно. Мога да покажа разбивката.`
        : 'Не успях да оформя надежден отговор на този въпрос. Сметката остава непроменена; моля, опитайте отново.';
      composition.offer = quoting ? 'breakdown' : 'none';
      // One bounded formatting repair for an informational answer. Reuse the
      // same verified snapshot/catalogue; never reroute or recalculate the job.
      if (decision.action === 'read') {
        try {
          const repaired = await this.model.json(
            'Repair the answer to the latest question using verified catalogue facts. Every monetary amount MUST be an exact {{reference}} from priceReferences, never literal digits or copied customer prices. Use pricingExplanation to distinguish creating a point, mounting a socket/switch, and installing a light fitting. Correct the customer if their stated rates are wrong. Do not offer to send files or claim a download exists. Give the explanation here, briefly, without changing quantities.',
            {
              message: body.message,
              state: writerContext,
              education: context.education,
              priceReferences: Object.keys(refs),
              rejectedDraft: composition.reply,
            },
            replySchemaFor(
              Boolean(next.active?.estimate),
              Boolean(next.candidate),
            ),
            record,
          );
          reply = renderReply(repaired.reply, refs);
          composition.offer = repaired.offer;
          validationIssue = undefined;
        } catch {
          /* Keep the factual fallback; do not turn a repair into a loop. */
        }
      }
    }
    if (
      ['update', 'compare'].includes(decision.action) &&
      (next.active?.estimate || next.candidate?.snapshot.estimate)
    )
      reply +=
        '\n\nТова е начален базов вариант с предполагаеми количества, не ограничение за броя контакти или осветителни изводи. Можем да ги променим според нуждите ви и да преизчислим труда; разпределението и капацитетът се проверяват при проектиране.';
    // An updated estimate has one clear next offer owned by the coordinator.
    if (decision.action === 'update' && next.active?.estimate)
      composition.offer = 'breakdown';
    if (composition.offer === 'candidate') {
      if (!next.candidate)
        throw new BadRequestException('No candidate to offer');
      next.pending = 'candidate';
    } else if (composition.offer === 'breakdown') next.pending = 'breakdown';
    if (composition.offer === 'breakdown')
      reply += '\n\nДа покажа ли разбивката?';
    const unpriced = unpricedEquipment(
      decision.action === 'compare'
        ? (next.candidate?.snapshot.facts ?? next.facts)
        : next.facts,
    );
    if (
      unpriced.length &&
      ['update', 'compare', 'accept', 'breakdown'].includes(decision.action)
    )
      reply += `\n\nОтделно за уточняване: ${unpriced.join(' и ')}. Захранващите им линии, защитите, подготовката и монтажът НЕ са включени в тази сума.`;
    const result = {
      conversationId: id,
      reply,
      turnRevision: body.expectedRevision + 1,
      state: next,
      operation: decision.action,
      ...(process.env.ENERGRID_PILOT_DIAGNOSTICS === 'true'
        ? { diagnostics: { decision, composition, validationIssue } }
        : {}),
    };
    const receipts = [
      ...pilot.receipts,
      { id: body.turnId, hash, result },
    ].slice(-10);
    // Receipts omit old state snapshots to avoid quadratic metadata growth.
    const storedReceipts = receipts.map((r: any) => ({
      ...r,
      result: {
        conversationId: r.result.conversationId,
        reply: r.result.reply,
        turnRevision: r.result.turnRevision,
      },
    }));
    const meta = {
      ...conversation.meta,
      pilot: {
        mode: 'residential-v1',
        turnRevision: body.expectedRevision + 1,
        state: next,
        receipts: storedReceipts,
      },
    };
    const saved = await this.db.systemQuery(
      `WITH updated AS (
      UPDATE assistant.conversations SET meta=$2::jsonb,last_message_at=now()
      WHERE id=$1 AND tenant_slug='energrid' AND (meta->'pilot'->>'turnRevision')::int=$3 RETURNING id
    ), user_turn AS (
      INSERT INTO assistant.messages(conversation_id,role,message_text,meta,created_at)
      SELECT id,'user',$4,$6::jsonb,now() FROM updated RETURNING id
    ), assistant_turn AS (
      INSERT INTO assistant.messages(conversation_id,role,message_text,meta,created_at)
      SELECT id,'assistant',$5,$6::jsonb,now()+interval '1 millisecond' FROM updated RETURNING id
    ) SELECT id FROM updated`,
      [
        id,
        JSON.stringify(meta),
        body.expectedRevision,
        body.message,
        reply,
        JSON.stringify({
          pilot: true,
          turnId: body.turnId,
          operation: decision.action,
          usage: usages,
        }),
      ],
    );
    if (saved.rowCount !== 1)
      throw new ConflictException(
        'Another turn completed first; reload before retrying',
      );
    return result;
  }
}
