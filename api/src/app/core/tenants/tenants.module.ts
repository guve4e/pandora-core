import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PgModule } from '../db/pg.module';
import { RolesGuard } from '../common/lib/guards/roles.guard';

@Module({
  imports: [PgModule],
  controllers: [TenantsController],
  providers: [TenantsService, RolesGuard],
  exports: [TenantsService],
})
export class TenantsModule {}
