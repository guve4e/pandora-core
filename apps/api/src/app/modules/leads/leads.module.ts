import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { LeadsService } from './leads.service';
import { LeadsRepository } from './leads.repository';
import { LeadMessagesRepository } from './lead-messages.repository';
import { LeadsInternalController } from './leads.internal.controller';

@Module({
  imports: [PgModule],
  controllers: [LeadsInternalController],
  providers: [LeadsService, LeadsRepository, LeadMessagesRepository],
  exports: [LeadsService],
})
export class LeadsModule {}
