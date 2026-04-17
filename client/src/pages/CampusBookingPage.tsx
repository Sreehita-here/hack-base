import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Calendar, Clock, AlertCircle, Check, MapPin, Zap } from 'lucide-react';
import api from '../lib/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useResourceStore } from '../stores/resourceStore';

export default function CampusBookingPage() {
  const { resources, fetchResources } = useResourceStore();
  const addToast = useNotificationStore(s => s.addToast);
  
  const [form, setForm] = useState({
    resourceId: '',
    date: new Date().toISOString().split('T')[0],
    startHour: 9,
    duration: 2,
    participants: 1,
    purpose: '',
  });

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchResources();
  }, []);

  const campusResources = resources.filter(r => r.category === 'lab' || r.category === 'equipment');

  // Trigger conflict check when time/resource changes
  useEffect(() => {
    if (form.resourceId && form.date) {
      checkAvailability();
    }
  }, [form.resourceId, form.date, form.startHour, form.duration]);

  const checkAvailability = async () => {
    setChecking(true);
    setConflicts(null);
    try {
      const res = await api.get('/bookings/check-conflict', {
        params: {
          resourceId: form.resourceId,
          date: form.date,
          startHour: form.startHour,
          endHour: form.startHour + form.duration,
          participants: form.participants,
        }
      });
      setConflicts(res.data);

      if (res.data.hasConflicts && !res.data.canProceed) {
        const altRes = await api.get('/bookings/available-slots', {
          params: { resourceId: form.resourceId, date: form.date, duration: form.duration }
        });
        setSuggestions(altRes.data);
      }
    } catch (e) {
      //
    } finally {
      setChecking(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicts?.hasConflicts && !conflicts?.canProceed) return;

    setLoading(true);
    try {
      await api.post('/bookings', {
        ...form,
        endHour: form.startHour + form.duration,
      });
      addToast({ type: 'success', title: 'Booking Confirmed', message: 'Your slot is secured.' });
      setForm({ ...form, purpose: '' }); // reset some fields
    } catch (err: any) {
      addToast({ type: 'error', title: 'Booking Failed', message: err.response?.data?.error || 'Double booked' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 neon-text-purple" />
          Campus Resource Booking
        </h1>
        <p className="text-sm text-white/50 mt-0.5">Book laboratories, computing clusters, and specialized equipment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-panel rounded-2xl p-6">
          <form className="space-y-5" onSubmit={handleBook}>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5 flex justify-between">
                <span>Select Resource</span>
                <span className="text-xs text-purple-400">Smart Suggestions Active</span>
              </label>
              <select
                required value={form.resourceId} onChange={e => setForm({ ...form, resourceId: e.target.value })}
                className="w-full px-4 py-3 glass-input rounded-xl text-sm transition-all [&_option]:bg-slate-900 [&_option]:text-white"
              >
                <option value="">-- Choose --</option>
                {campusResources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Date</label>
                <input
                  type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Start Time</label>
                <select
                  required value={form.startHour} onChange={e => setForm({ ...form, startHour: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all [&_option]:bg-slate-900 [&_option]:text-white"
                >
                  {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(h => {
                    const isPast = form.date === new Date().toISOString().split('T')[0] && h <= new Date().getHours();
                    return (
                      <option key={h} value={h} disabled={isPast}>
                        {h}:00 - {h >= 12 ? 'PM' : 'AM'} {isPast && '(Unavailable)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Duration (Hours)</label>
                <select
                  required value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all [&_option]:bg-slate-900 [&_option]:text-white"
                >
                  {[1, 2, 3, 4].map(h => <option key={h} value={h}>{h} Hour{h > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Team Size</label>
                <input
                  type="number" min="1" required value={form.participants} onChange={e => setForm({ ...form, participants: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Purpose / Project</label>
              <input
                type="text" required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-4 py-2.5 glass-input rounded-xl text-sm transition-all text-white"
                placeholder="e.g., Final Year Project Data Processing"
              />
            </div>

            <button
              type="submit"
              disabled={loading || checking || (conflicts?.hasConflicts && !conflicts?.canProceed)}
              className="w-full py-3.5 bg-purple-600/80 hover:bg-purple-600 border border-purple-500/50 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:-translate-y-0.5"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        {/* Validation & Smart Suggestions Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {checking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-blue-900/40 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 shadow-inner">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-300">Checking availability engine...</span>
              </motion.div>
            )}

            {!checking && conflicts && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`border p-5 rounded-2xl backdrop-blur-md ${conflicts.hasConflicts && !conflicts.canProceed ? 'bg-red-900/30 border-red-500/40' : 'bg-emerald-900/30 border-emerald-500/40'}`}>
                <div className="flex items-start gap-3">
                  {conflicts.hasConflicts && !conflicts.canProceed ? (
                    <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                  ) : (
                    <Check className="w-6 h-6 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h4 className={`font-bold text-lg ${conflicts.hasConflicts && !conflicts.canProceed ? 'text-red-300' : 'text-emerald-300'}`}>
                      {conflicts.hasConflicts && !conflicts.canProceed ? 'Time Slot Unavailable' : 'Slot Available!'}
                    </h4>
                    {conflicts.hasConflicts && conflicts.conflicts.map((c: any, i: number) => (
                      <p key={i} className="text-sm text-red-400 mt-1">• {c.reason}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!checking && conflicts?.hasConflicts && !conflicts?.canProceed && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border-purple-500/30 text-center p-5 rounded-2xl shadow-[inset_0_0_20px_rgba(147,51,234,0.1)]">
                <div className="flex items-center gap-2 mb-4 text-purple-300 font-bold justify-center drop-shadow-[0_0_5px_rgba(147,51,234,0.5)]">
                  <Zap className="w-5 h-5" /> Smart Alternatives
                </div>
                <div className="space-y-3">
                  {suggestions.slice(0, 3).map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setForm({ ...form, startHour: slot.startHour, duration: slot.endHour - slot.startHour })}
                      className="w-full flex items-center justify-between p-3 border border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-purple-100">{slot.timeSlot}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-500/30 text-purple-200 rounded-md font-medium border border-purple-500/30">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!form.resourceId && (
            <div className="h-full flex flex-col items-center justify-center text-white/40 bg-white/5 rounded-2xl border border-dashed border-white/20 min-h-[300px]">
              <MapPin className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Select a resource to check availability</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
