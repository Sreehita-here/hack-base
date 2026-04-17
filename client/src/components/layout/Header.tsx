import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Wifi, WifiOff } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import NotificationCenter from '../notifications/NotificationCenter';

export default function Header() {
  const { unreadCount, fetchNotifications, isOpen, setOpen } = useNotificationStore();
  const user = useAuthStore(s => s.user);
  const [connected] = useState(true);
  const [search, setSearch] = useState('');
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 glass-panel border-x-0 border-t-0 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
        <input
          type="text"
          placeholder="Search resources, requests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 glass-input rounded-xl text-sm transition-all"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          connected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? 'Connected' : 'Offline'}
        </div>

        {/* Notifications bell */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setOpen(!isOpen)}
            className="relative p-2 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {isOpen && <NotificationCenter />}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-4 border-l border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{user?.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
