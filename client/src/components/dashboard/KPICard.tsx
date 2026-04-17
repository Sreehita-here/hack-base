import { useEffect, useState, useRef } from 'react';

const colorMap: Record<string, { bg: string; icon: string; text: string; glow: string }> = {
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400', text: 'text-blue-300', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  green: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-300', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
  amber: { bg: 'bg-amber-500/20', icon: 'text-amber-400', text: 'text-amber-300', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  red: { bg: 'bg-red-500/20', icon: 'text-red-400', text: 'text-red-300', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
};

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend: string;
  color: string;
  pulse?: boolean;
}

export default function KPICard({ icon, label, value, trend, color, pulse }: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number>();
  const style = colorMap[color] || colorMap.blue;

  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const from = displayValue;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.floor(from + (value - from) * eased));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value]);

  return (
    <div className={`glass-panel rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 border border-white/5 ${style.glow} hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] ${pulse ? 'animate-pulse-glow' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.icon} shadow-inner border border-white/5`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-white/60 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${style.text} drop-shadow-md`}>
        {displayValue.toLocaleString()}
      </p>
      <p className="text-xs text-white/40 mt-2">{trend}</p>
    </div>
  );
}
