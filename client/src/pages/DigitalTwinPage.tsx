import { useEffect, useRef, useState } from 'react';
import { useResourceStore } from '../stores/resourceStore';
import { getSocket } from '../lib/socket';
import { Cpu, Activity, Wind, FlaskConical, Wrench } from 'lucide-react';

// ── Helpers ──
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Generate stable unit labels per resource
function makeLabels(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// ── Sub-components ──

/** Single coloured tile representing one unit */
function UnitTile({ label, state, flash }: { label: string; state: 'available' | 'occupied' | 'maintenance'; flash: boolean }) {
  const bg =
    state === 'available'  ? 'bg-emerald-500/80 border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
    state === 'maintenance' ? 'bg-amber-500/80 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                              'bg-red-500/50 border-red-400/30 shadow-[0_0_6px_rgba(239,68,68,0.3)]';

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-lg border text-[10px] font-bold tracking-wide
        transition-all duration-500
        ${bg}
        ${flash ? 'scale-110 ring-2 ring-cyan-300/60' : ''}
        w-full aspect-square
      `}
    >
      <span className="text-white/90 drop-shadow-sm select-none">{label}</span>
    </div>
  );
}

/** Ward / device grid panel */
function WardPanel({
  title, icon, resource, prefix,
}: {
  title: string;
  icon: React.ReactNode;
  resource: { totalCount: number; availableCount: number; occupiedCount: number; maintenanceCount: number };
  prefix: string;
}) {
  const labels = makeLabels(prefix, resource.totalCount);
  const prevRef = useRef(resource);
  const [flashSet, setFlashSet] = useState<Set<number>>(new Set());

  // Detect which tiles flipped state
  useEffect(() => {
    const prev = prevRef.current;
    if (
      prev.availableCount !== resource.availableCount ||
      prev.occupiedCount !== resource.occupiedCount ||
      prev.maintenanceCount !== resource.maintenanceCount
    ) {
      // Pick a few random indices to flash (visual only)
      const changed = new Set<number>();
      const diff = Math.abs(resource.availableCount - prev.availableCount) + Math.abs(resource.maintenanceCount - prev.maintenanceCount);
      for (let k = 0; k < Math.min(diff, 3); k++) {
        changed.add(Math.floor(Math.random() * resource.totalCount));
      }
      setFlashSet(changed);
      setTimeout(() => setFlashSet(new Set()), 800);
    }
    prevRef.current = { ...resource };
  }, [resource]);

  // Map index → state
  const getState = (i: number): 'available' | 'occupied' | 'maintenance' => {
    if (i < resource.availableCount) return 'available';
    if (i < resource.availableCount + resource.occupiedCount) return 'occupied';
    return 'maintenance';
  };

  // How many columns for the grid
  const cols = resource.totalCount <= 10 ? 5 : resource.totalCount <= 20 ? 5 : 6;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.08)] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400">{icon}</span>
        <h3 className="text-sm font-bold text-cyan-200 tracking-wide">{title} ({resource.totalCount} Units)</h3>
      </div>

      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {labels.map((lbl, i) => (
          <UnitTile key={lbl} label={lbl} state={getState(i)} flash={flashSet.has(i)} />
        ))}
      </div>

      {/* Legend counts */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-white/50 border-t border-white/5 pt-3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> {resource.availableCount} Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> {resource.occupiedCount} Occupied</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> {resource.maintenanceCount} Maint.</span>
      </div>
    </div>
  );
}

// ── Lab time-slot panel ──
const LAB_SLOTS = ['09–11', '11–13', '14–16', '16–18'];

function LabCard({ resource }: { resource: { id: string; name: string; totalCount: number; availableCount: number; occupiedCount: number; maintenanceCount: number } }) {
  // Derive slot availability from the resource counts
  // Each "unit" maps to a slot; if total < 4 we repeat
  const slotStates = LAB_SLOTS.map((_, i) => {
    if (i < resource.availableCount) return 'available';
    if (i < resource.availableCount + resource.occupiedCount) return 'occupied';
    return 'maintenance';
  });

  return (
    <div className="glass-panel rounded-xl p-4 border border-white/10 min-w-[140px] flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-bold text-white/90 truncate">{resource.name}</span>
      </div>
      {LAB_SLOTS.map((slot, i) => {
        const st = slotStates[i];
        const bg =
          st === 'available'  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/30' :
          st === 'occupied'   ? 'bg-red-500/20 text-red-300/70 border-red-500/20' :
                                'bg-amber-500/20 text-amber-300/70 border-amber-500/20';
        const label = st === 'available' ? 'A' : st === 'occupied' ? 'O' : 'M';
        return (
          <div key={slot} className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[10px] font-semibold ${bg} transition-all duration-500`}>
            <span>{slot}</span>
            <span className="uppercase tracking-wider">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──
export default function DigitalTwinPage() {
  const { resources, fetchResources } = useResourceStore();

  useEffect(() => {
    fetchResources();

    // Listen for simulation broadcasts
    const socket = getSocket();
    const onUpdate = () => { fetchResources(); };
    if (socket) {
      socket.on('resources_updated', onUpdate);
    }
    // Fallback poll
    const interval = setInterval(() => fetchResources(), 15000);

    return () => {
      clearInterval(interval);
      if (socket) socket.off('resources_updated', onUpdate);
    };
  }, []);

  // Categorise resources
  const icu    = resources.find(r => r.category === 'icu_bed');
  const genBed = resources.find(r => r.category === 'general_bed');
  const vents  = resources.find(r => r.category === 'ventilator');
  const labs   = resources.filter(r => r.category === 'lab');
  const equip  = resources.filter(r => r.category === 'equipment');

  return (
    <div className="space-y-6 animate-fade-in relative z-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 drop-shadow-md">
            <Cpu className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Digital Twin
          </h1>
          <p className="text-sm text-white/50 mt-0.5 flex items-center gap-2">
            Live hospital resource visualization
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </p>
        </div>
      </div>

      {/* Ward grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {icu && (
          <WardPanel
            title="ICU Ward"
            icon={<Activity className="w-5 h-5" />}
            resource={icu}
            prefix="B"
          />
        )}
        {vents && (
          <WardPanel
            title="Ventilators"
            icon={<Wind className="w-5 h-5" />}
            resource={vents}
            prefix="V"
          />
        )}
      </div>

      {genBed && (
        <WardPanel
          title="General Ward"
          icon={<Activity className="w-5 h-5" />}
          resource={genBed}
          prefix="G"
        />
      )}

      {/* Lab rooms */}
      {labs.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-200 tracking-wide">Lab Rooms</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {labs.map(lab => <LabCard key={lab.id} resource={lab} />)}
          </div>
        </div>
      )}

      {/* Equipment */}
      {equip.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-200 tracking-wide">Equipment</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equip.map(eq => (
              <WardPanel key={eq.id} title={eq.name} icon={<Wrench className="w-4 h-4" />} resource={eq} prefix="E" />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-white/40 border-t border-white/5 pt-4">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400/60" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/50 border border-red-400/30" /> Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400/60" /> Maintenance / Critical</span>
      </div>
    </div>
  );
}
