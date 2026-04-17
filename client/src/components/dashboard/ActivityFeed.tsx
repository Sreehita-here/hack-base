import { Radio } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

const typeIcons: Record<string, string> = {
  allocation: '🟢',
  request_queued: '🟡',
  resource_released: '🔴',
  emergency_override: '⚡',
  priority_boosted: '⬆️',
  request_cancelled: '❌',
  resource_maintenance: '🔧',
  booking_created: '📅',
  booking_cancelled: '📕',
};

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
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
    <div className="glass-panel rounded-2xl p-6 h-full border border-white/5">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Radio className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
        Live Activity Feed
      </h3>

      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {activities.slice(0, 15).map(activity => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <span className="text-base mt-0.5 shrink-0 drop-shadow-md">{typeIcons[activity.type] || '📋'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{activity.title}</p>
              <p className="text-xs text-white/60 truncate">{activity.description}</p>
              <p className="text-[10px] text-white/40 mt-1">{timeAgo(activity.timestamp)}</p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
