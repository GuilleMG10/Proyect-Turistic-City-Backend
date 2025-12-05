import { useState, useRef, useCallback, useEffect } from 'react';
import type { TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent, CSSProperties } from 'react';

type UseDraggableModalOptions = {
  isOpen: boolean;
  onClose: () => void;
  threshold?: number; // percentage to close (default 30%)
};

type UseDraggableModalReturn = {
  dragHandleProps: {
    onTouchStart: (e: ReactTouchEvent) => void;
    onTouchMove: (e: ReactTouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: ReactMouseEvent) => void;
  };
  modalStyle: CSSProperties;
  isDragging: boolean;
};

/**
 * Hook for creating draggable bottom sheet modals on mobile.
 * Allows users to drag the modal down to close it.
 */
export function useDraggableModal({
  isOpen,
  onClose,
  threshold = 30,
}: UseDraggableModalOptions): UseDraggableModalReturn {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const startY = useRef(0);
  const currentY = useRef(0);
  const modalHeight = useRef(0);

  // Track isOpen changes - this is necessary to reset drag state when modal opens/closes
  // The setState calls here are intentional and required for proper modal behavior
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      // Modal just opened - reset everything
      currentY.current = 0;
      startY.current = 0;
      setTranslateY(0);
      setIsDragging(false);
      setPrevIsOpen(true);
    } else if (!isOpen && prevIsOpen) {
      // Modal just closed - reset for next open
      currentY.current = 0;
      startY.current = 0;
      setTranslateY(0);
      setIsDragging(false);
      setPrevIsOpen(false);
    }
  }, [isOpen, prevIsOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle mouse move for desktop dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const deltaY = e.clientY - startY.current;
      if (deltaY > 0) {
        currentY.current = deltaY;
        setTranslateY(deltaY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const percentDragged = (currentY.current / modalHeight.current) * 100;
      
      if (percentDragged > threshold) {
        onClose();
      } else {
        setTranslateY(0);
      }
      currentY.current = 0;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onClose, threshold]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    startY.current = e.touches[0].clientY;
    modalHeight.current = (e.currentTarget.closest('[data-modal-content]') as HTMLElement)?.offsetHeight || window.innerHeight * 0.9;
    currentY.current = 0; // Reset on drag start
    setTranslateY(0); // Ensure visual state is reset
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      setTranslateY(deltaY);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const percentDragged = (currentY.current / modalHeight.current) * 100;
    
    if (percentDragged > threshold) {
      onClose();
    } else {
      setTranslateY(0);
    }
    currentY.current = 0;
  }, [onClose, threshold]);

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    startY.current = e.clientY;
    modalHeight.current = (e.currentTarget.closest('[data-modal-content]') as HTMLElement)?.offsetHeight || window.innerHeight * 0.9;
    currentY.current = 0; // Reset on drag start
    setTranslateY(0); // Ensure visual state is reset
    setIsDragging(true);
  }, []);

  return {
    dragHandleProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
    },
    modalStyle: {
      transform: `translateY(${translateY}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    },
    isDragging,
  };
}
