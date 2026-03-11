import { Module } from '@nestjs/common';
import { PgModule } from '../../core/db/pg.module';
import { LeadsModule } from '../leads/leads.module';
import { TenantLeadsController } from './tenant-leads.controller';
import { TenantLeadsService } from './tenant-leads.service';

@Module({
  imports: [PgModule, LeadsModule],
  controllers: [TenantLeadsController],
  providers: [TenantLeadsService],
})
export class TenantLeadsModule {}
