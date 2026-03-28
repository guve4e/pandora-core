import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import type { AssistantChatInput } from '../ai/ai.types';
import { AssistantConfigService } from '../assistant-config/assistant-config.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly ai: AiService,
    private readonly assistantConfig: AssistantConfigService,
  ) {}

  async chat(input: AssistantChatInput) {
    const profile = await this.assistantConfig.getTenantProfile(input.tenantSlug);
    return this.ai.chat(input, profile);
  }
}
