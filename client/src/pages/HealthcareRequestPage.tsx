import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, AlertTriangle, Clock, Send, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useNotificationStore } from '../stores/notificationStore';

export default function HealthcareRequestPage() {
  const [form, setForm] = useState({
    resourceType: 'icu_bed',
    severity: 'moderate',
    isEmergency: false,
    details: { age: '', diagnosis: '', condition: '' }
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const addToast = useNotificationStore(s => s.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/requests', {
        ...form,
        details: { ...form.details, age: parseInt(form.details.age) || 0 }
      });
      setResult(res.data);
      addToast({
        type: res.data.allocation.status === 'allocated' ? 'success' : 'info',
        title: 'Request Submitted',
        message: res.data.allocation.message,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to submit request',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HeartPulse className="w-6 h-6 neon-text-cyan" />
          Healthcare Resource Request
        </h1>
        <p className="text-sm text-white/50 mt-0.5">Submit patient requirements for beds, ventilators, or specialized care.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div className="md:col-span-2 glass-panel rounded-2xl p-6">
          {result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                result.allocation.status === 'allocated' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {result.allocation.status === 'allocated' ? <HeartPulse className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {result.allocation.status === 'allocated' ? 'Resource Allocated!' : 'Added to Queue'}
              </h3>
              <p className="text-cyan-100/70 max-w-sm mb-6">{result.allocation.message}</p>
              
              {result.allocation.status === 'queued' && (
                <div className="bg-white/5 rounded-xl p-4 w-full max-w-sm border border-white/10 shadow-inner">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Queue Position:</span>
                    <span className="font-bold text-white">#{result.allocation.queuePosition}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Est. Wait Time:</span>
                    <span className="font-bold text-white">~{result.allocation.estimatedWait} min</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => { setResult(null); setForm(f => ({ ...f, isEmergency: false })); }}
                className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/10"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Emergency Toggle */}
              <div className={`p-4 rounded-xl border-2 transition-colors flex items-start gap-4 cursor-pointer shadow-lg ${
                form.isEmergency ? 'bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`} onClick={() => setForm({ ...form, isEmergency: !form.isEmergency })}>
                <div className={`p-2 rounded-lg ${form.isEmergency ? 'bg-red-500 text-white shadow-[0_0_10px_red]' : 'bg-white/10 text-white/50'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${form.isEmergency ? 'text-red-400 drop-shadow-[0_0_5px_red]' : 'text-white'}`}>Emergency Override</h4>
                  <p className={`text-sm mt-0.5 ${form.isEmergency ? 'text-red-300' : 'text-white/50'}`}>
                    Use ONLY for immediate life-threatening situations. Triggers automatic resource preemption.
                  </p>
                </div>
                <div className="self-center">
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${form.isEmergency ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-[0_0_5px_rgba(0,0,0,0.5)] ${form.isEmergency ? 'left-7' : 'left-1'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Resource Type</label>
                  <select
                    value={form.resourceType} onChange={e => setForm({ ...form, resourceType: e.target.value })}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all [&_option]:bg-slate-900 [&_option]:text-white"
                  >
                    <option value="icu_bed">ICU Bed</option>
                    <option value="general_bed">General Bed</option>
                    <option value="ventilator">Ventilator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Severity / Triage Level</label>
                  <select
                    value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                    disabled={form.isEmergency}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all disabled:opacity-50 [&_option]:bg-slate-900 [&_option]:text-white"
                  >
                    <option value="critical">Critical (Red)</option>
                    <option value="moderate">Moderate (Yellow)</option>
                    <option value="mild">Mild (Green)</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white/80 mb-3 border-b border-white/10 pb-2">Patient Details</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Age</label>
                    <input
                      type="number" value={form.details.age} onChange={e => setForm({ ...form, details: { ...form.details, age: e.target.value } })}
                      className="w-full px-3 py-2 glass-input rounded-lg text-sm" placeholder="Years"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Diagnosis</label>
                    <input
                      type="text" value={form.details.diagnosis} onChange={e => setForm({ ...form, details: { ...form.details, diagnosis: e.target.value } })}
                      className="w-full px-3 py-2 glass-input rounded-lg text-sm" placeholder="Brief diagnosis"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Clinical Notes</label>
                  <textarea
                    value={form.details.condition} onChange={e => setForm({ ...form, details: { ...form.details, condition: e.target.value } })}
                    rows={3}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm resize-none" placeholder="Vital signs, specific needs..."
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className={`w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 ${
                  form.isEmergency ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'neon-glow-btn'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {form.isEmergency ? 'Submit Emergency Request' : 'Submit Request'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="glass-panel border-cyan-500/30 rounded-2xl p-5 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2 neon-text-cyan">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              Priority System
            </h4>
            <p className="text-sm text-cyan-100/70 mb-3">Requests are fulfilled based on a dynamic priority engine considering:</p>
            <ul className="text-sm text-cyan-100/70 space-y-2 list-disc pl-4">
              <li>Clinical severity score (Base)</li>
              <li>Wait time (Anti-starvation boost)</li>
              <li>Patient vulnerability factors (Age)</li>
              <li>Historical equity metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
