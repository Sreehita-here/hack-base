interface Resource {
  id: string;
  name: string;
  category: string;
  totalCount: number;
  availableCount: number;
  occupiedCount: number;
  maintenanceCount: number;
  status: string;
  location: string;
}

const categoryIcons: Record<string, string> = {
  icu_bed: '🏥', general_bed: '🛏️', ventilator: '💨', lab: '🔬', equipment: '🔧',
};

const categoryLabels: Record<string, string> = {
  icu_bed: 'ICU Beds', general_bed: 'General Beds', ventilator: 'Ventilators', lab: 'Laboratory', equipment: 'Equipment',
};

export default function ResourceGrid({ resources }: { resources: Resource[] }) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5">
      <h3 className="text-base font-bold text-white mb-4">Resource Availability</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {resources.map(resource => {
          const availPercent = resource.totalCount > 0
            ? Math.round((resource.availableCount / resource.totalCount) * 100)
            : 0;
          const statusColor = availPercent > 50 ? 'emerald' : availPercent > 20 ? 'amber' : 'red';

          return (
            <div
              key={resource.id}
              className={`relative rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 bg-white/5 border-l-4 ${
                statusColor === 'emerald' ? 'border-l-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/20' :
                statusColor === 'amber' ? 'border-l-amber-500 shadow-amber-500/10 hover:shadow-amber-500/20' : 'border-l-red-500 shadow-red-500/10 hover:shadow-red-500/20'
              } border-t border-r border-b border-t-white/10 border-r-white/5 border-b-white/5 hover:bg-white/10`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-lg mr-1.5 drop-shadow-md">{categoryIcons[resource.category] || '📦'}</span>
                  <span className="text-sm font-semibold text-white/90">{resource.name}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  resource.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  resource.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-white/10 text-white/60 border-white/20'
                }`}>
                  {resource.status}
                </span>
              </div>

              <div className="text-2xl font-bold text-white mb-2">
                {resource.availableCount}<span className="text-sm font-normal text-white/40">/{resource.totalCount}</span>
              </div>

              {/* Status grid */}
              <div className="flex flex-wrap gap-1 mb-3">
                {Array.from({ length: Math.min(resource.totalCount, 20) }).map((_, i) => {
                  let color = 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]'; // available
                  if (i >= resource.availableCount && i < resource.availableCount + resource.occupiedCount) {
                    color = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]';
                  } else if (i >= resource.availableCount + resource.occupiedCount) {
                    color = 'bg-white/20';
                  }
                  return <div key={i} className={`w-3 h-3 rounded-full ${color} transition-colors duration-500`} />;
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_currentColor] ${
                    statusColor === 'emerald' ? 'bg-emerald-400 text-emerald-400' :
                    statusColor === 'amber' ? 'bg-amber-400 text-amber-400' : 'bg-red-500 text-red-500'
                  }`}
                  style={{ width: `${100 - availPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-white/50">
                <span>{resource.occupiedCount} occupied</span>
                <span>{resource.maintenanceCount} maintenance</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
