import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsRepository } from './leads.repository';
import { PgModule } from '../../core/db/pg.module';

@Module({
  imports: [PgModule],
  providers: [LeadsService, LeadsRepository],
  exports: [LeadsService],
})
export class LeadsModule {}
