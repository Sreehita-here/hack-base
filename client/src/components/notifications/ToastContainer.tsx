import { X } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';

const typeStyles = {
  success: { border: 'neon-border-green', icon: '✅' },
  error: { border: 'neon-border-red', icon: '❌' },
  warning: { border: 'neon-border-yellow', icon: '⚠️' },
  info: { border: 'border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3),inset_0_0_10px_rgba(6,182,212,0.1)]', icon: 'ℹ️' },
  urgent: { border: 'neon-border-red shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse', icon: '🚨' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[380px]">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const style = typeStyles[toast.type] || typeStyles.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative glass-panel rounded-xl overflow-hidden ${style.border}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{style.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{toast.title}</p>
                      <p className="text-sm text-cyan-100 mt-0.5 line-clamp-2">{toast.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-white/40 hover:text-white/80 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                className="h-[3px] bg-current opacity-20"
                style={{ animation: `shrink ${toast.duration || 5000}ms linear forwards` }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
