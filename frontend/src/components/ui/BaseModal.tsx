import type { ReactNode, CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDraggableModal } from '../../hooks/useDraggableModal';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // Optional customization
  title?: string;
  titleId?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;

  // Header customization
  headerContent?: ReactNode;
  headerClassName?: string;
  headerGradient?: boolean;

  // Drag handle customization for mobile
  dragHandleClassName?: string;

  // Z-index control for stacking modals
  zIndex?: number;
};

const maxWidthClasses = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
  '2xl': 'md:max-w-2xl',
  '4xl': 'md:max-w-4xl',
};

/**
 * Base modal component that handles:
 * - Escape key to close
 * - Body scroll locking
 * - Mobile drag-to-close
 * - Backdrop click to close
 * - Consistent styling
 * 
 * Use this as the foundation for all modal dialogs.
 */
export default function BaseModal({
  isOpen,
  onClose,
  children,
  title,
  titleId,
  maxWidth = '2xl',
  showCloseButton = true,
  headerContent,
  headerClassName,
  headerGradient = false,
  dragHandleClassName,
  zIndex = 1000,
}: BaseModalProps) {
  // Handle escape key
  useModalEscape(isOpen, onClose);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Draggable modal for mobile
  const { dragHandleProps, modalStyle, isDragging } = useDraggableModal({
    isOpen,
    onClose,
    threshold: 25,
  });

  if (!isOpen) return null;

  const defaultDragHandleClass = headerGradient
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
    : 'bg-white dark:bg-gray-800';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      <section
        className={`bg-white dark:bg-gray-800 w-full md:rounded-2xl ${maxWidthClasses[maxWidth]} h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 relative rounded-t-3xl md:rounded-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-modal-content
        style={modalStyle as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div
          className={`sticky top-0 z-30 md:hidden rounded-t-3xl cursor-grab active:cursor-grabbing pt-2 ${dragHandleClassName || defaultDragHandleClass}`}
          {...dragHandleProps}
        >
          <div className="flex justify-center py-3">
            <div
              className={`w-12 h-1.5 rounded-full transition-colors ${isDragging
                ? headerGradient ? 'bg-white/60' : 'bg-gray-400 dark:bg-gray-500'
                : headerGradient ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            />
          </div>
        </div>

        {/* Optional Header */}
        {(title || headerContent) && (
          <header
            className={`relative overflow-hidden ${headerGradient
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white -mt-3 md:mt-0 md:rounded-t-2xl'
              : 'bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700'
              } ${headerClassName || 'p-6'}`}
          >
            {headerGradient && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            )}

            <div className="relative flex items-center justify-between">
              {headerContent || (
                <h2 id={titleId} className="text-2xl font-bold">
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={`hidden md:flex p-2 rounded-full transition-all focus:outline-none focus:ring-2 ${headerGradient
                    ? 'hover:bg-white/20 text-white/90 hover:text-white focus:ring-white/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:ring-gray-200'
                    }`}
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </header>
        )}

        {children}
      </section>
    </div>
  );
}

/**
 * Modal content wrapper with consistent padding
 */
export function ModalContent({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal footer with action buttons
 */
export function ModalFooter({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer className={`flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </footer>
  );
}
