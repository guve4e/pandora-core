import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  tenantId: string | null = null;
  userId: string | null = null;
  role: string | null = null;

  setFromJwt(payload: { tenant_id?: string; sub?: string; role?: string }) {
    this.tenantId = payload.tenant_id ?? null;
    this.userId = payload.sub ?? null;
    this.role = payload.role ?? null;
  }

  requireTenantId(): string {
    if (!this.tenantId) throw new Error('TenantContext: tenantId missing');
    return this.tenantId;
  }
}
