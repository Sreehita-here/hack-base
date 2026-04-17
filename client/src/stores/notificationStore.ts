import { create } from 'zustand';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'urgent';
  title: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  toasts: Toast[];
  isOpen: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setOpen: (open: boolean) => void;
}

let toastId = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  isOpen: false,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/admin/notifications');
      set({ notifications: res.data.notifications, unreadCount: res.data.unreadCount });
    } catch { /* ignore */ }
  },

  markAllRead: async () => {
    try {
      await api.put('/admin/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  },

  markRead: async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  },

  addToast: (toast) => {
    const state = get();
    // Throttle duplicates (don't show the exact same message if it's currently on screen)
    if (state.toasts.some(t => t.message === toast.message)) {
      return;
    }
    const id = `toast-${++toastId}`;
    set(s => ({ toasts: [...s.toasts, { ...toast, id }].slice(-3) }));
    const duration = toast.duration || (toast.type === 'urgent' ? 10000 : 5000);
    setTimeout(() => get().removeToast(id), duration);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  setOpen: (open) => set({ isOpen: open }),
}));
