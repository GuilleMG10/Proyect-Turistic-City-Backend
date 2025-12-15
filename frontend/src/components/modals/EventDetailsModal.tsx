
import { useEffect, useState } from 'react';
import { X, MapPin, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDraggableModal } from '../../hooks/useDraggableModal';
import type { EventWithStatus } from '../../types';
import { getEventStatusColor } from '../../utils/eventStatus';
import { useUserStore } from '../../store/userStore';
import EventFormModal from './EventFormModal';
import ConfirmModal from './ConfirmModal';
import ReviewsList from '../ui/ReviewsList';
import GoogleMapsLink from '../ui/GoogleMapsLink';
import { ApiService } from '../../services/api';
import { useToastStore } from '../../store/toastStore';

type Props = {
  event: EventWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function EventDetailsModal({ event, isOpen, onClose, onUpdate }: Props) {
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore((state) => state.isAdmin());
  const addToast = useToastStore((state) => state.addToast);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the modal dialog when it opens
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modal.focus();
      }
    }
  }, [isOpen]);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await ApiService.deleteEvent(event.id);
      onClose();
      onUpdate?.(); // Refetch immediately - backend query time provides natural delay
    } catch {
      addToast('Error al eliminar el evento', 'error');
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    onClose();
    onUpdate?.(); // Refetch immediately - backend query time provides natural delay
  };

  if (!isOpen) return null;

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = eventDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusConfig = getEventStatusColor(event.status);

  return (
    <>
      <EventFormModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[1000] md:p-4"
        onClick={onClose}
      >
        <section
          className="bg-white dark:bg-gray-800 w-full md:rounded-2xl md:max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 relative rounded-t-3xl md:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-details-title"
          data-modal-content
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div
            className="sticky top-0 z-30 md:hidden bg-gradient-to-r from-cyan-600 to-blue-600 rounded-t-3xl cursor-grab active:cursor-grabbing pt-2"
            {...dragHandleProps}
          >
            <div className="flex justify-center py-3">
              <div className={`w-12 h-1.5 rounded-full transition-colors ${isDragging ? 'bg-white/60' : 'bg-white/30'}`} />
            </div>
          </div>

          {/* Hero Header */}
          <div className="relative h-40 md:h-64 w-full bg-gradient-to-r from-cyan-600 to-blue-600 overflow-hidden md:rounded-t-2xl -mt-3 md:mt-0">
            {/* Close Button - desktop only */}
            <button
              onClick={onClose}
              className="hidden md:flex absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 z-20"
              aria-label="Cerrar detalles"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Abstract Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            {/* Title & Date Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium border border-white/10">
                      {event.category}
                    </span>
                  </div>
                  <h2 id="event-modal-title" className="text-3xl md:text-4xl font-bold mb-2 text-shadow-sm leading-tight">
                    {event.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm md:text-base text-gray-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Date Badge */}
                <div className="hidden md:flex flex-col items-center justify-center h-20 w-20 bg-white text-gray-900 rounded-2xl shadow-lg shrink-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {eventDate.toLocaleString('es-ES', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-bold leading-none">
                    {eventDate.getDate()}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {eventDate.getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
            {/* Main Content (Left Column) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sobre este evento</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {event.description}
                </p>
              </section>

              {/* Reviews */}
              <ReviewsList reviews={event.reviews || []} />
            </div>

            {/* Sidebar (Right Column) */}
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="space-y-3">
                <div className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 mr-4">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Fecha y Hora</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg capitalize">
                      {formattedDate}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formattedTime} hrs
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 mr-4">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Precio de entrada</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      {event.price > 0 ? `Bs ${event.price}` : 'Gratuito'}
                    </p>
                  </div>
                </div>

                {event.latitude && event.longitude && (
                  <GoogleMapsLink
                    latitude={event.latitude}
                    longitude={event.longitude}
                    label="Ver ubicación en mapa"
                    markerColor="red"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200 dark:shadow-none"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Evento
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-200 dark:shadow-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Eliminando...' : 'Eliminar Evento'}
                    </button>
                  </>
                ) : (
                  <>
                    {user && event.status !== 'finished' && (
                      <button
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-bold shadow-lg shadow-gray-200 dark:shadow-none"
                      >
                        Me interesa
                      </button>
                    )}
                    <button
                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Compartir evento
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="¿Eliminar este evento?"
        message={`¿Estás seguro de que deseas eliminar "${event.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}