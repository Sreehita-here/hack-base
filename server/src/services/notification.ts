import { v4 as uuid } from 'uuid';
import { store } from '../store/DataStore';
import { Notification, NotificationType, NotificationPriority } from '../types';

export function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
}): Notification {
  const notification: Notification = {
    id: uuid(),
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    priority: params.priority,
    read: false,
    actionUrl: params.actionUrl,
    actionLabel: params.actionLabel,
    createdAt: new Date().toISOString(),
  };

  store.addNotification(notification);
  return notification;
}
