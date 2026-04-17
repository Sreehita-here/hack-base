import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard, Package, HeartPulse, GraduationCap,
  ListOrdered, Shield, LogOut, Activity
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'doctor', 'student'] },
  { to: '/resources', icon: Package, label: 'Resources', roles: ['admin', 'doctor', 'student'] },
  { to: '/healthcare-request', icon: HeartPulse, label: 'Healthcare Request', roles: ['doctor'] },
  { to: '/campus-booking', icon: GraduationCap, label: 'Campus Booking', roles: ['student'] },
  { to: '/queue', icon: ListOrdered, label: 'Waiting Queue', roles: ['admin', 'doctor', 'student'] },
  { to: '/admin', icon: Shield, label: 'Admin Panel', roles: ['admin'] },
];

export default function Sidebar() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const location = useLocation();

  const filteredNav = navItems.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-64 glass-panel border-y-0 border-l-0 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight neon-text-cyan">SmartAlloc</h1>
            <p className="text-xs text-white/50">Resource Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || 
            (item.to === '/dashboard' && location.pathname === '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-white/10 text-cyan-300 shadow-[inset_2px_0_0_rgba(6,182,212,1)] border border-white/10'
                  : 'text-white/60 hover:bg-white/5 hover:text-cyan-200'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'neon-text-cyan' : ''}`} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/40 capitalize">{user?.role || 'guest'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
