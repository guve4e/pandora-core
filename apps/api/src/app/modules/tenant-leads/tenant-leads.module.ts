import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { TenantLeadsController } from './tenant-leads.controller';
import { TenantLeadsService } from './tenant-leads.service';

@Module({
  imports: [PgModule],
  controllers: [TenantLeadsController],
  providers: [TenantLeadsService],
})
export class TenantLeadsModule {}
