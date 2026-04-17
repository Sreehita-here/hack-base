import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Activity, HeartPulse, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    }
  };

  const demoAccounts = [
    { email: 'admin@hospital.com', password: 'AdminDemo$2026', label: 'Admin', icon: '👤' },
    { email: 'doctor@hospital.com', password: 'DoctorDemo$2026', label: 'Doctor', icon: '🩺' },
    { email: 'student@campus.edu', password: 'StudentDemo$2026', label: 'Student', icon: '🎓' },
  ];

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Left side — Hero */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900/80 via-blue-900/50 to-indigo-900/80 relative overflow-hidden backdrop-blur-md border-r border-white/10"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Activity className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">SmartAlloc</h1>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4 drop-shadow-md">
            Intelligent Resource<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-sm">
              Allocation System
            </span>
          </h2>

          <p className="text-lg text-white/70 mb-12 max-w-md drop-shadow-sm">
            Smart scheduling, priority-based allocation, and real-time management for healthcare and campus resources.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                <HeartPulse className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium drop-shadow-sm">Healthcare Management</p>
                <p className="text-sm text-white/50">ICU beds, ventilators, medical staff</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                <GraduationCap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium drop-shadow-sm">Campus Resources</p>
                <p className="text-sm text-white/50">Labs, equipment, time slot booking</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right side — Form */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-8 bg-transparent relative z-10"
      >
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">Welcome back</h2>
            <p className="text-white/60 mt-2">Sign in to your account to continue</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 backdrop-blur-sm ${shakeError ? 'animate-shake' : ''}`}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <label className="block text-sm font-medium text-white/80 mb-1.5 drop-shadow-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/30"
              />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <label className="block text-sm font-medium text-white/80 mb-1.5 drop-shadow-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 glass-input rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all pr-10 placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 border border-blue-400/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </motion.div>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-colors drop-shadow-sm">Create one</Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 pt-8 border-t border-white/10 relative">
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-[#0a0f25] px-4 text-xs text-white/40 uppercase tracking-widest rounded-full border border-white/5">
              Quick Demo Login
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={async () => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    clearError();
                    const success = await login(acc.email, acc.password);
                    if (success) {
                      navigate('/dashboard');
                    } else {
                      setShakeError(true);
                      setTimeout(() => setShakeError(false), 500);
                    }
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-center transition-all group hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="text-2xl block mb-2 drop-shadow-md group-hover:scale-110 transition-transform">{acc.icon}</span>
                  <span className="text-[11px] font-bold text-white/50 group-hover:text-white/90 uppercase tracking-wide">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
