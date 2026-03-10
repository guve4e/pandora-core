import { Global, Module } from '@nestjs/common';
import { TenantContext } from './tenants-context';

@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantContextModule {}
