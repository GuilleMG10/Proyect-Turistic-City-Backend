
import { X, MapPin, Star, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import type { EventWithStatus } from '../types';
import { getEventStatusColor } from '../utils/eventStatus';

type Props = {
  event: EventWithStatus;
  isOpen: boolean;
  onClose: () => void;
};

export default function EventDetailsModal({ event, isOpen, onClose }: Props) {
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{event.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{formattedDate}</p>
                <p className="text-sm text-gray-600">{formattedTime}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">{event.description}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </h3>
            <p className="text-gray-700">{event.location}</p>
            {event.latitude && event.longitude && (
              <p className="text-sm text-gray-500 mt-1">
                Coordenadas: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Precio</span>
              </div>
              <p className="font-semibold">Bs {event.price}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Categoría</span>
              </div>
              <p className="font-semibold">{event.category}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Creado</span>
              </div>
              <p className="font-semibold">
                {new Date(event.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Reviews */}
          {event.reviews && event.reviews.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reseñas ({event.reviews.length})
              </h3>
              <div className="space-y-3">
                {event.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
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
                      <span className="text-sm font-medium">{review.rating}/5</span>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {event.status !== 'finished' && (
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Marcar como interesado
              </button>
            )}
            <button className={`${event.status === 'finished' ? 'w-full' : 'flex-1'} border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50`}>
              Compartir evento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}