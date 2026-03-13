import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { IntakeService } from './intake.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Public } from '../../core/common/lib/decorators/public.decorator';

@Controller('public/intake/sessions')
export class IntakeController {
  constructor(private readonly intake: IntakeService) {}

  @Public()
  @Post()
  createSession(@Body() dto: CreateSessionDto) {
    return this.intake.createSession(dto.tenantSlug);
  }

  @Public()
  @Get(':id')
  getSession(@Param('id') id: string) {
    const session = this.intake.getSession(id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  @Public()
  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const session = await this.intake.addUserMessage(id, dto.text);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}
