
import { useEffect } from 'react';
import { X, MapPin, Star, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import type { EventWithStatus } from '../types';
import { getEventStatusColor } from '../utils/eventStatus';

type Props = {
  event: EventWithStatus;
  isOpen: boolean;
  onClose: () => void;
};

export default function EventDetailsModal({ event, isOpen, onClose }: Props) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <section className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 id="event-modal-title" className="text-xl font-semibold">{event.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar detalles del evento"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <section className="p-6 space-y-6">
          {/* Status and Date */}
          <aside className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium"><time dateTime={event.event_date}>{formattedDate}</time></p>
                <p className="text-sm text-gray-600"><time dateTime={event.event_date}>{formattedTime}</time></p>
              </div>
            </div>
            <mark className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </mark>
          </aside>

          {/* Description */}
          <section>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">{event.description}</p>
          </section>

          {/* Location */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </h3>
            <address className="text-gray-700 not-italic">{event.location}</address>
            {event.latitude && event.longitude && (
              <p className="text-sm text-gray-500 mt-1">
                Coordenadas: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
              </p>
            )}
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <strong className="text-sm font-medium">Precio</strong>
              </div>
              <p className="font-semibold">Bs {event.price}</p>
            </article>

            <article className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                <strong className="text-sm font-medium">Categoría</strong>
              </div>
              <p className="font-semibold">{event.category}</p>
            </article>

            <article className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <strong className="text-sm font-medium">Creado</strong>
              </div>
              <p className="font-semibold">
                <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString('es-ES')}</time>
              </p>
            </article>
          </section>

          {/* Reviews */}
          {event.reviews && event.reviews.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reseñas ({event.reviews.length})
              </h3>
              <div className="space-y-3">
                {event.reviews.map((review) => (
                  <article key={review.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <strong className="text-sm font-medium">{review.rating}/5</strong>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('es-ES')}</time>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <footer className="flex gap-3 pt-4">
            {event.status !== 'finished' && (
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-describedby="interest-button-desc"
              >
                Marcar como interesado
                <span id="interest-button-desc" className="sr-only">
                  Agregar este evento a tu lista de intereses
                </span>
              </button>
            )}
            <button 
              className={`${event.status === 'finished' ? 'w-full' : 'flex-1'} border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-describedby="share-button-desc"
            >
              Compartir evento
              <span id="share-button-desc" className="sr-only">
                Compartir la información de este evento en redes sociales
              </span>
            </button>
          </footer>
        </section>
      </section>
    </div>
  );
}