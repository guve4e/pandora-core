import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface ValidTenantResult {
  id: string;
  slug: string;
  name: string;
}

@Injectable()
export class TenantValidationService {
  private readonly logger = new Logger(TenantValidationService.name);

  async validateTenantSlug(slug: string): Promise<ValidTenantResult> {
    const apiBase = process.env.CORE_API_BASE_URL || 'http://localhost:3001/api';
    const internalToken = process.env.INTERNAL_API_TOKEN || '';

    try {
      const res = await fetch(
        `${apiBase}/internal/tenants/slug/${encodeURIComponent(slug)}`,
        {
          method: 'GET',
          headers: {
            'x-internal-token': internalToken,
          },
        },
      );

      if (res.status === 404) {
        throw new BadRequestException(`Invalid tenant slug: ${slug}`);
      }

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(
          `Tenant validation failed for slug=${slug}: ${res.status} ${text}`,
        );
        throw new ServiceUnavailableException('Tenant validation failed');
      }

      return (await res.json()) as ValidTenantResult;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Tenant validation request failed for slug=${slug}: ${error?.message}`,
        error?.stack,
      );

      throw new ServiceUnavailableException('Tenant validation unavailable');
    }
  }
}
