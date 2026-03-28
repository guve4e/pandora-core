import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { TenantAiUsageController } from './tenant-ai-usage.controller';
import { TenantAiUsageRepository } from './tenant-ai-usage.repository';
import { TenantAiUsageService } from './tenant-ai-usage.service';

@Module({
  imports: [PgModule],
  controllers: [TenantAiUsageController],
  providers: [TenantAiUsageRepository, TenantAiUsageService],
  exports: [TenantAiUsageService],
})
export class TenantAiUsageModule {}
