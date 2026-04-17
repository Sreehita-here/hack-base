import { useEffect } from 'react';
import { useResourceStore } from '../stores/resourceStore';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import ResourceGrid from '../components/dashboard/ResourceGrid';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import PriorityChart from '../components/dashboard/PriorityChart';

export default function DashboardPage() {
  const { dashboardStats, fetchDashboard, fetchActivities, fetchResources, activities, resources } = useResourceStore();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    fetchDashboard();
    fetchActivities();
    fetchResources();
    const interval = setInterval(() => { fetchDashboard(); fetchActivities(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = dashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-md">Dashboard</h1>
          <p className="text-sm text-white/60 mt-0.5">Real-time overview of all resources</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live updates active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <KPICard
            icon={<Activity className="w-6 h-6" />}
            label="Total Resources"
            value={stats?.totalResources || 0}
            trend={`${stats?.resourceBreakdown?.length || 0} categories`}
            color="blue"
          />
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <KPICard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Allocated"
            value={stats?.totalAllocated || 0}
            trend={`${stats?.utilizationPercent || 0}% utilization`}
            color="green"
          />
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <KPICard
            icon={<Clock className="w-6 h-6" />}
            label="Waiting Queue"
            value={stats?.totalWaiting || 0}
            trend={`Avg ${stats?.avgWaitTime || 0}m wait`}
            color="amber"
          />
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <KPICard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Critical Alerts"
            value={stats?.criticalAlerts || 0}
            trend={stats?.criticalAlerts ? `${stats.criticalAlerts} active` : 'All clear'}
            color="red"
            pulse={!!stats?.criticalAlerts}
          />
        </motion.div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Grid - 2 cols */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-panel rounded-2xl p-6"
        >
          <ResourceGrid resources={resources} />
        </motion.div>

        {/* Dynamic Panel based on role */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          className="glass-panel rounded-2xl p-6"
        >
          {user?.role === 'admin' ? (
             <ActivityFeed activities={activities} />
          ) : (
             <div>
                <h3 className="text-lg font-bold neon-text-cyan mb-4 flex items-center gap-2">
                   <Calendar className="w-5 h-5" /> My Active Bookings
                </h3>
                <div className="space-y-3">
                   {stats?.todayAllocations === 0 ? (
                      <p className="text-sm text-cyan-100/50">No active bookings for today.</p>
                   ) : (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                         <p className="text-sm font-semibold text-white">Lab Booking Confirmed</p>
                         <p className="text-xs text-white/50 mt-1">Today</p>
                         <button className="mt-3 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/40 transition-colors w-full tracking-wide">
                            CANCEL BOOKING
                         </button>
                      </div>
                   )}
                </div>
             </div>
          )}
        </motion.div>
      </div>

      {/* Bottom grid - Only visible to admin/doctor for now, or styled for all */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="glass-panel rounded-2xl p-2">
          <PriorityChart distribution={stats?.priorityDistribution} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
          className="glass-panel rounded-2xl border border-white/10 p-6 shadow-sm"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Recent Allocations
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white/70">Today</span>
              </div>
              <span className="text-lg font-bold neon-text-cyan">{stats?.todayAllocations || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/70">This Week</span>
              </div>
              <span className="text-lg font-bold neon-text-purple">{stats?.weekAllocations || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-white/70">This Month</span>
              </div>
              <span className="text-lg font-bold text-white">{stats?.monthAllocations || 0}</span>
            </div>
          </div>

          {/* Fairness metrics */}
          {stats?.fairnessMetrics && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white/60 mb-3">Fairness Score</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden shadow-inner border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${stats.fairnessMetrics.fairnessScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold neon-text-cyan">{stats.fairnessMetrics.fairnessScore}/100</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
