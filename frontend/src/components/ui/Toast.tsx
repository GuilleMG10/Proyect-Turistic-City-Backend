import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { Toast as ToastType } from '../../store/toastStore';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

const styles = {
  success: 'bg-white dark:bg-gray-800 border-green-500/20',
  error: 'bg-white dark:bg-gray-800 border-red-500/20',
  info: 'bg-white dark:bg-gray-800 border-blue-500/20',
  warning: 'bg-white dark:bg-gray-800 border-yellow-500/20',
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

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform
        ${styles[toast.type]}
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={handleClose}
        className="shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
