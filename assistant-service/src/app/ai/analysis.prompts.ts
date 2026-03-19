import type { AssistantChatTurn } from './ai.types';

export function buildConversationAnalysisPrompt(
  tenantSlug: string,
  history: AssistantChatTurn[],
): string {
  const conversation = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  return `
You analyze assistant conversations for a sales dashboard.

Conversation:
${conversation}

Return STRICT JSON with this schema:

{
  "summary": string,
  "intent": string,
  "city": string | null,
  "serviceType": string | null,
  "leadScore": number
}

Rules:

summary
Short description of what the user wants.

intent
Main goal (examples: electrical_installation, repair, solar_installation, general_question).

city
Extract city if mentioned.

serviceType
Specific service requested.

leadScore
0-100 probability this is a real sales lead.

Scoring guideline:
0-30 informational
31-60 mild interest
61-80 likely customer
81-100 strong lead

Return ONLY JSON.
`.trim();
}
