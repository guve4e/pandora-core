import { Module } from '@nestjs/common';
import { TenantValidationService } from './tenant-validation.service';

@Module({
  providers: [TenantValidationService],
  exports: [TenantValidationService],
})
export class TenantValidationModule {}
