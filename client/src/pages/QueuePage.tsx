import { useEffect, useState } from 'react';
import { useResourceStore } from '../stores/resourceStore';
import { getSocket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { ListOrdered, TrendingUp, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

export default function QueuePage() {
  const { queue, fetchQueue } = useResourceStore();
  const [resourceType, setResourceType] = useState('icu_bed');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchQueue(resourceType);
    
    const socket = getSocket();
    if (socket) {
      socket.on('queue_updated', () => {
        fetchQueue(resourceType);
        setLastUpdate(new Date());
      });
      return () => { socket.off('queue_updated'); };
    }
  }, [resourceType]);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
            <ListOrdered className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Waiting Queue Tracking
          </h1>
          <p className="text-sm text-white/60 mt-0.5">Real-time anti-starvation priority queue visualization</p>
        </div>
        <div className="text-right">
          <select
            value={resourceType} onChange={e => setResourceType(e.target.value)}
            className="px-4 py-2 glass-input border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all"
          >
            <option value="icu_bed" className="bg-slate-900 text-white font-medium">ICU Beds Queue</option>
            <option value="ventilator" className="bg-slate-900 text-white font-medium">Ventilators Queue</option>
            <option value="general_bed" className="bg-slate-900 text-white font-medium">General Beds Queue</option>
          </select>
          <p className="text-[10px] text-white/40 mt-2 flex items-center gap-1 justify-end">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
             Last synced: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Analytics Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex gap-8">
         <div className="flex-1">
            <h3 className="text-white/60 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Dynamic Priority Engine
            </h3>
            <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-lg">
              This system uses an advanced anti-starvation algorithm. Lower priority requests slowly gain "boost points" over time to prevent indefinite waiting while still honoring critical emergencies.
            </p>
         </div>
         <div className="w-px bg-white/10" />
         <div className="flex gap-8">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-1">Queue Size</p>
              <p className="text-3xl font-bold">{queue.length}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-1">Avg Est. Wait</p>
              <p className="text-3xl font-bold text-amber-400">~{queue.length > 0 ? queue[Math.floor(queue.length/2)]?.estimatedWait : 0}m</p>
            </div>
         </div>
      </div>

      {/* Queue List */}
      <div className="glass-panel rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 text-xs font-semibold text-white/50 uppercase tracking-wider backdrop-blur-md">
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-3">Patient / Requester</div>
          <div className="col-span-2">Base Severity</div>
          <div className="col-span-3">Dynamic Priority Formula</div>
          <div className="col-span-2 text-right">Wait Time</div>
          <div className="col-span-1 text-center">Trend</div>
        </div>

        <div className="divide-y divide-white/5 p-2">
          <AnimatePresence>
            {queue.map((item: any, idx: number) => {
              const borderGlow = item.severity === 'critical' ? 'shadow-[inset_4px_0_0_#ef4444,0_0_15px_rgba(239,68,68,0.2)]' :
                                 item.severity === 'moderate' ? 'shadow-[inset_4px_0_0_#f59e0b,0_0_15px_rgba(245,158,11,0.2)]' :
                                 'shadow-[inset_4px_0_0_#10b981,0_0_15px_rgba(16,185,129,0.1)]';

              return (
              <motion.div
                key={item.requestId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`grid grid-cols-12 gap-4 p-4 mt-2 mb-2 items-center bg-white/5 rounded-xl transition-all hover:scale-[1.01] ${borderGlow} hover:bg-white/10`}
              >
                <div className="col-span-1 flex justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-white/10 text-white drop-shadow-md`}>
                    #{item.position}
                  </div>
                </div>

                <div className="col-span-3">
                  <p className="font-bold text-white text-sm flex items-center gap-2 drop-shadow-md">
                    {item.userName}
                    {item.isEmergency && <ShieldAlert className="w-4 h-4 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" title="Emergency Override Active" />}
                  </p>
                  <p className="text-xs text-cyan-200/50 font-mono mt-0.5">{item.requestId.split('-')[0]}</p>
                </div>

                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                    item.severity === 'critical' ? 'text-red-400 border border-red-500/30 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                    item.severity === 'moderate' ? 'text-amber-400 border border-amber-500/30 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  }`}>
                    {item.severity}
                  </span>
                </div>

                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex-1 bg-white/10 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                    {/* Base */}
                    <div className="bg-cyan-500 h-full drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" style={{ width: `${Math.min((item.basePriority / 100) * 100, 100)}%` }} title="Base Priority" />
                    {/* Wait Boost */}
                    {item.priorityBoosts.waitTime > 0 && (
                      <div className="bg-amber-400 h-full drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" style={{ width: `${Math.min((item.priorityBoosts.waitTime / 100) * 100, 100)}%` }} title="Time Boost" />
                    )}
                    {/* Vulnerability Boost */}
                    {item.priorityBoosts.vulnerability > 0 && (
                      <div className="bg-purple-500 h-full drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" style={{ width: `${Math.min((item.priorityBoosts.vulnerability / 100) * 100, 100)}%` }} title="Vulnerability Boost" />
                    )}
                  </div>
                  <span className="text-xs font-bold neon-text-cyan w-8 text-right">{Math.round(item.currentPriority)}</span>
                </div>

                <div className="col-span-2 text-right">
                  <div className="text-sm font-medium text-white drop-shadow-md">{item.waitingTime}m</div>
                  <div className="text-[10px] text-white/50 flex justify-end items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-white/40" /> Est. {item.estimatedWait}m
                  </div>
                </div>

                <div className="col-span-1 flex justify-center">
                  {item.priorityBoosts.waitTime > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]" title="Prioritized by Anti-Starvation" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>

          {queue.length === 0 && (
             <div className="p-12 text-center text-white/40">
               <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20 text-white" />
               <p className="text-lg font-medium text-white/60 drop-shadow-sm">Queue is empty</p>
               <p className="text-sm mt-1 text-white/40">Resources are available or no pending requests.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
