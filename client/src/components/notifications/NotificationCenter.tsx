import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, Check, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationCenter() {
  const { notifications, markAllRead, markRead } = useNotificationStore();

  const grouped = {
    today: notifications.filter(n => {
      const d = new Date(n.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }),
    earlier: notifications.filter(n => {
      const d = new Date(n.createdAt);
      const today = new Date();
      return d.toDateString() !== today.toDateString();
    }),
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-12 w-96 glass-panel rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden z-50 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <h3 className="text-base font-bold text-white drop-shadow-sm">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Mark all read">
            <Check className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {grouped.today.length > 0 && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider bg-white/5">Today</p>
            {grouped.today.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 transition-colors ${!n.read ? 'bg-blue-500/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{n.title}</p>
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-white/40 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {grouped.earlier.length > 0 && (
          <>
            <p className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider bg-white/5">Earlier</p>
            {grouped.earlier.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 transition-colors ${!n.read ? 'bg-blue-500/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">{n.title}</p>
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-white/40 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <Bell className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
