import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsCleanupService } from './notifications-cleanup.service';

@Injectable()
export class NotificationsCronService {
  constructor(private readonly cleanup: NotificationsCleanupService) {}

  // runs every night at 03:00
  @Cron('0 3 * * *')
  async handleCleanup() {
    const deleted = await this.cleanup.cleanupOldNotifications();
    console.log(`[notifications] cleanup removed ${deleted} old notifications`);
  }
}
