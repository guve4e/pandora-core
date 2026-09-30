import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { TenantConversationsController } from './tenant-conversations.controller';
import { TenantConversationsService } from './tenant-conversations.service';

@Module({
  imports: [PgModule],
  controllers: [TenantConversationsController],
  providers: [TenantConversationsService],
})
export class TenantConversationsModule {}
