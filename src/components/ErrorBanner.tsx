import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 flex items-start gap-3 shadow-sm"
    >
      <div className="shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-rose-800 mb-0.5">Processing Error</div>
        <div className="text-sm text-rose-600 leading-relaxed">{message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-rose-100 transition-colors text-rose-400 hover:text-rose-600"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
