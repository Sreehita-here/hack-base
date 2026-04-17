import { useState, useEffect } from 'react';
import { Settings, Users, Database } from 'lucide-react';
import api from '../lib/api';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      const { data } = await api.put(`/admin/users/${id}`, updates);
      setUsers(users.map(u => (u.id === id ? data : u)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
          <Settings className="w-6 h-6 text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]" />
          Admin Panel
        </h1>
        <p className="text-sm text-white/60 mt-0.5">Manage system configuration, users, and override commands.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <Database className="w-5 h-5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
            System Control
          </h3>
          <p className="text-sm text-white/60 mb-4">Master controls for the allocation engine algorithms.</p>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-white/10 rounded-xl hover:bg-white/5 bg-white/5 transition-colors cursor-pointer">
              <div>
                <p className="font-semibold text-sm text-white/90">Anti-Starvation Engine</p>
                <p className="text-xs text-white/50">Gradually boosts priority of waiting items</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-500 rounded border-white/20 bg-white/10 focus:ring-blue-500/50 focus:ring-offset-0" />
            </label>
            
            <label className="flex items-center justify-between p-3 border border-white/10 rounded-xl hover:bg-white/5 bg-white/5 transition-colors cursor-pointer">
              <div>
                <p className="font-semibold text-sm text-white/90">Emergency Preemption</p>
                <p className="text-xs text-white/50">Allow critical requests to preempt active users</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-500 rounded border-white/20 bg-white/10 focus:ring-blue-500/50 focus:ring-offset-0" />
            </label>
            
            <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
              Save Configuration
            </button>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex flex-col max-h-[600px]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white shrink-0">
            <Users className="w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]" />
            User Management
          </h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-40 text-white/50">Loading users...</div>
            ) : (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="p-4 border border-white/10 rounded-xl bg-white/5 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-white drop-shadow-sm">{user.name}</p>
                        <p className="text-xs text-white/50 font-mono mt-0.5">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value })}
                          className="bg-slate-800 border border-white/20 rounded-md text-xs text-white px-2 py-1.5 outline-none focus:border-purple-400 shadow-inner font-semibold uppercase tracking-wider"
                        >
                          <option value="student">Student</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-1">
                      <span className="text-xs text-white/40 uppercase tracking-widest font-semibold flex items-center gap-2">
                        Status
                        <span className={`w-2 h-2 rounded-full shadow-lg ${user.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'}`} />
                      </span>
                      <button
                        onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                        className={`text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-md font-bold transition-all shadow-sm ${
                          user.isActive 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40'
                        }`}
                      >
                        {user.isActive ? 'Disable Account' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
