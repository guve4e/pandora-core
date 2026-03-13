import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { AssistantChatInput } from '../ai/ai.types';
import { KnowledgeService } from '../knowledge/knowledge.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly ai: AiService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async chat(input: AssistantChatInput) {
    const profile = await this.knowledge.getTenantProfile(input.tenantSlug);
    return this.ai.chat(input, profile);
  }
}
