import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import type {
  NotificationDeliveryCommand,
  NotificationEvent,
  NotificationSeverity,
  StoredNotification,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async notify(event: NotificationEvent): Promise<void> {
    const command = this.resolveEvent(event);
    await this.repo.create(command);
  }

  async create(command: NotificationDeliveryCommand): Promise<void> {
    await this.repo.create(command);
  }

  async listForUser(
    tenantId: string,
    userId: string,
    limit = 50,
  ): Promise<StoredNotification[]> {
    return this.repo.listForUser(tenantId, userId, limit);
  }

  async unreadCountForUser(tenantId: string, userId: string): Promise<number> {
    return this.repo.unreadCountForUser(tenantId, userId);
  }

  async markRead(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<{ updated: boolean }> {
    const updated = await this.repo.markRead(tenantId, id, userId);
    return { updated: updated > 0 };
  }

  async markAllRead(
    tenantId: string,
    userId: string,
  ): Promise<{ updatedCount: number }> {
    const updatedCount = await this.repo.markAllRead(tenantId, userId);
    return { updatedCount };
  }

  private resolveEvent(event: NotificationEvent): NotificationDeliveryCommand {
    return {
      tenantId: event.tenantId,
      userId: event.userId ?? null,
      type: event.type,
      title: event.title ?? this.defaultTitle(event.type),
      message: event.message ?? this.defaultMessage(event),
      severity: event.severity ?? 'info',
      channels: event.channels?.length ? event.channels : ['in_app'],
      entityType: event.entityType,
      entityId: event.entityId,
      link: event.link,
      meta: event.payload,
    };
  }

  private defaultTitle(type: string): string {
    return type
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private defaultMessage(event: NotificationEvent): string {
    return event.message ?? `Notification event received: ${event.type}`;
  }
}
