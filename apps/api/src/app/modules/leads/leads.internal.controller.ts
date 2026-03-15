import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../../core/common/lib/decorators/public.decorator';
import { LeadsService } from './leads.service';
import { CreateAssistantLeadDto } from './dto/create-assistant-lead.dto';

@Controller('internal/leads')
export class LeadsInternalController {
  constructor(private readonly leads: LeadsService) {}

  @Public()
  @Post('assistant')
  async createFromAssistant(
    @Headers('x-internal-token') internalToken: string | undefined,
    @Body() body: CreateAssistantLeadDto,
  ) {
    const expected = process.env.INTERNAL_API_TOKEN || '';

    if (!expected || internalToken !== expected) {
      throw new UnauthorizedException('Invalid internal token');
    }

    return this.leads.createFromAssistant(body);
  }
}
