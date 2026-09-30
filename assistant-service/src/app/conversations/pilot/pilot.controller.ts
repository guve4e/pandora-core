import { Body, Controller, Param, Post } from '@nestjs/common';
import { PilotService } from './pilot.service';
@Controller('pilot/conversations')
export class PilotController {
  constructor(private readonly pilot: PilotService) {}
  @Post() create() {
    return this.pilot.create();
  }
  @Post(':id/messages') turn(
    @Param('id') id: string,
    @Body() body: { message: string; turnId: string; expectedRevision: number },
  ) {
    return this.pilot.turn(id, body);
  }
}
