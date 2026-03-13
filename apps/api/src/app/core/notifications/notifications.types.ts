export type NotificationSeverity =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'critical';

export type NotificationChannel =
  | 'in_app'
  | 'email'
  | 'sms';

export type NotificationEvent = {
  type: string;
  tenantId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  severity?: NotificationSeverity;
  channels?: NotificationChannel[];
  link?: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
};

export type NotificationDeliveryCommand = {
  tenantId: string;
  userId?: string | null;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  entityType?: string;
  entityId?: string;
  link?: string;
  meta?: Record<string, unknown>;
};

export type StoredNotification = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  entity_type: string | null;
  entity_id: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type UnreadCountRow = {
  count: string;
};
