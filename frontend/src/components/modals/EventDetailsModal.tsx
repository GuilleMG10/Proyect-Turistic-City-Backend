
import { useEffect, useState } from 'react';
import { X, MapPin, Star, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import type { EventWithStatus } from '../../types';
import { getEventStatusColor } from '../../utils/eventStatus';
import { useUserStore } from '../../store/userStore';
import EventFormModal from './EventFormModal';
import ConfirmModal from './ConfirmModal';
import { ApiService } from '../../services/api';

type Props = {
  event: EventWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function EventDetailsModal({ event, isOpen, onClose, onUpdate }: Props) {
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore((state) => state.isAdmin());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await ApiService.deleteEvent(event.id);
      onClose();
      onUpdate?.(); // Refetch immediately - backend query time provides natural delay
    } catch {
      alert('Error al eliminar el evento');
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
        onClick={onClose}
      >
      <section 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="event-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Header */}
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-cyan-600 to-blue-600 overflow-hidden">
          {/* Abstract Pattern Overlay */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar detalles"
          >
            <X className="h-6 w-6" />
          </button>

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
            {event.reviews && event.reviews.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  Reseñas
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                    ({event.reviews.length})
                  </span>
                </h3>
                <div className="grid gap-4">
                  {event.reviews.map((review) => (
                    <article key={review.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={review.created_at}>
                          {new Date(review.created_at).toLocaleDateString('es-ES')}
                        </time>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
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
                <div className="bg-gray-50 dark:bg-gray-700/30 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 mt-4">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 group cursor-pointer"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-10 dark:opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <MapPin className="h-6 w-6 text-red-600 dark:text-red-400 drop-shadow-md" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-center text-blue-600 dark:text-blue-400 group-hover:underline">
                        Ver ubicación en mapa
                      </p>
                    </div>
                  </div>
                </div>
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
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
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