import { Module } from '@nestjs/common';
import { PgModule } from '@org/backend-db';
import { AuthModule } from '../../core/auth/auth.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [PgModule, AuthModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
