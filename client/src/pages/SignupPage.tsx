import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Loader2, Activity } from 'lucide-react';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', role: 'student', department: '' });
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (form.password !== form.confirmPassword) {
      return;
    }
    const success = await signup(form);
    if (success) navigate('/dashboard');
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative z-10">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8"
      >
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-inner flex items-center justify-center">
             <Activity className="w-5 h-5 text-cyan-400 drop-shadow-md" />
           </div>
           <h1 className="text-xl font-bold text-white drop-shadow-md">SmartAlloc</h1>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Create your account</h2>
        <p className="text-white/60 text-sm mb-6">Join the smart resource allocation platform</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 backdrop-blur-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Full Name</label>
            <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
              className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Email</label>
            <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Password</label>
              <input type="password" required value={form.password} onChange={e => update('password', e.target.value)}
                className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Confirm Password</label>
              <input type="password" required value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                className={`w-full px-4 py-2.5 glass-input border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/30 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50 ring-1 ring-red-500/50' : 'border-white/10'}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Role</label>
              <select value={form.role} onChange={e => update('role', e.target.value)}
                className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all border border-white/10">
                <option value="student" className="bg-slate-900 text-white">Student</option>
                <option value="doctor" className="bg-slate-900 text-white">Doctor/Staff</option>
                <option value="admin" className="bg-slate-900 text-white">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1 drop-shadow-sm">Department</label>
              <input type="text" value={form.department} onChange={e => update('department', e.target.value)}
                placeholder="e.g. Cardiology, CS"
                className="w-full px-4 py-2.5 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/30" />
            </div>
          </div>

          <button type="submit" disabled={isLoading || (form.confirmPassword.length > 0 && form.password !== form.confirmPassword)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 border border-blue-400/30 mt-4">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Already have an account? <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-colors drop-shadow-sm">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
