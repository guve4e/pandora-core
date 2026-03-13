import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsRepository } from './leads.repository';
import { LeadMessagesRepository } from './lead-messages.repository';
import { PgModule } from '@org/backend-db';

@Module({
  imports: [PgModule],
  providers: [LeadsService, LeadsRepository, LeadMessagesRepository],
  exports: [LeadsService, LeadMessagesRepository],
})
export class LeadsModule {}
