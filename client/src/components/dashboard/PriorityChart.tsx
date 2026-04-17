import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface Props {
  distribution?: { critical: number; moderate: number; mild: number };
}

export default function PriorityChart({ distribution }: Props) {
  const data = [
    { name: 'Critical', value: distribution?.critical || 0, color: '#EF4444' },
    { name: 'Moderate', value: distribution?.moderate || 0, color: '#F59E0B' },
    { name: 'Mild', value: distribution?.mild || 0, color: '#3B82F6' },
  ];

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
        <PieIcon className="w-4 h-4 text-purple-400 drop-shadow-[0_0_3px_rgba(192,132,252,0.8)]" />
        Priority Distribution
      </h3>

      <div className="h-48" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={150}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                padding: '12px',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
              itemStyle={{ color: 'white' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color, boxShadow: `0 0 5px ${d.color}` }} />
            <span className="text-xs text-white/50">
              {d.name} {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
