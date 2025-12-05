import { useEffect } from 'react';

/**
 * Hook to handle Escape key press to close modals
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param enabled - Optional flag to enable/disable the escape handler (default: true)
 */
export function useModalEscape(
  isOpen: boolean,
  onClose: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, enabled]);
}
