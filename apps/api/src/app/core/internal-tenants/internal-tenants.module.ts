import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { InternalTenantsController } from './internal-tenants.controller';

@Module({
  imports: [PgModule],
  controllers: [InternalTenantsController],
})
export class InternalTenantsModule {}
