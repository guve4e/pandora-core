import { http } from './http';
import { debug, debugError } from '../debug';

export type NotificationItem = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  entity_type: string | null;
  entity_id: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export async function getNotifications(
  limit = 20,
): Promise<NotificationItem[]> {
  debug('notifications', 'GET /notifications', { limit });

  try {
    const { data } = await http.get<NotificationItem[]>('/notifications', {
      params: { limit },
    });

    debug('notifications', 'GET /notifications response', {
      count: data?.length ?? 0,
      ids: data?.map((x) => x.id) ?? [],
    });

    return data;
  } catch (err) {
    debugError('notifications', 'GET /notifications failed', err);
    throw err;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  debug('notifications', 'GET /notifications/unread-count');

  try {
    const { data } = await http.get<{ count: number }>(
      '/notifications/unread-count',
    );

    const count = Number(data.count ?? 0);

    debug('notifications', 'GET /notifications/unread-count response', {
      count,
    });

    return count;
  } catch (err) {
    debugError('notifications', 'GET /notifications/unread-count failed', err);
    throw err;
  }
}

export async function markNotificationRead(
  id: string,
): Promise<{ updated: boolean }> {
  debug('notifications', 'POST /notifications/:id/read', { id });

  try {
    const { data } = await http.post<{ updated: boolean }>(
      `/notifications/${id}/read`,
    );

    debug('notifications', 'POST /notifications/:id/read response', data);

    return data;
  } catch (err) {
    debugError('notifications', 'POST /notifications/:id/read failed', {
      id,
      err,
    });
    throw err;
  }
}

export async function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  debug('notifications', 'POST /notifications/read-all');

  try {
    const { data } = await http.post<{ updatedCount: number }>(
      '/notifications/read-all',
    );

    debug('notifications', 'POST /notifications/read-all response', data);

    return data;
  } catch (err) {
    debugError('notifications', 'POST /notifications/read-all failed', err);
    throw err;
  }
}
