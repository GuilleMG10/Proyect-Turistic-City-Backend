import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { Toast as ToastType } from '../../store/toastStore';

// Icon backgrounds and text colors per type
const iconConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-500',
    textColor: 'text-white',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
  },
};

// Toast container styles per type
const containerStyles = {
  success: 'bg-white dark:bg-slate-800 border-l-4 border-l-green-500',
  error: 'bg-white dark:bg-slate-800 border-l-4 border-l-red-500',
  info: 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-500',
  warning: 'bg-white dark:bg-slate-800 border-l-4 border-l-amber-500',
};

export default function Toast({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 300); // Wait for exit animation
  };

  const { icon: Icon, bgColor, textColor } = iconConfig[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 p-3 pr-4 rounded-xl shadow-lg transition-all duration-300 transform
        ${containerStyles[toast.type]}
        ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
      `}
      role="alert"
    >
      {/* Colored icon container */}
      <div className={`shrink-0 p-2 rounded-lg ${bgColor}`}>
        <Icon className={`h-5 w-5 ${textColor}`} />
      </div>
      
      {/* Message */}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 leading-relaxed">
        {toast.message}
      </p>
      
      {/* Close button */}
      <button
        onClick={handleClose}
        className="shrink-0 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
