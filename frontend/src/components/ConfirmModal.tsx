import { AlertTriangle } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = 'danger'
}: Props) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`rounded-full p-3 ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon} ${variant === 'danger' ? 'dark:text-red-400' : variant === 'warning' ? 'dark:text-yellow-400' : 'dark:text-blue-400'}`} />
          </div>
        </div>

        {/* Title */}
        <h2 id="confirm-title" className="text-xl font-semibold text-center text-gray-900 dark:text-white">
          {title}
        </h2>

        {/* Message */}
        <p id="confirm-message" className="text-center text-gray-600 dark:text-gray-300">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
