import { useEffect } from 'react';
import { X, MapPin, Star, Calendar, Users } from 'lucide-react';
import type { Place } from '../types';
import { getImageSrc, handleImageError } from '../utils/imageUtils';

type Props = {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
};

export default function PlaceDetailsModal({ place, isOpen, onClose }: Props) {
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

  const averageRating = place.reviews && place.reviews.length > 0 
    ? place.reviews.reduce((sum: number, r) => sum + r.rating, 0) / place.reviews.length 
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <section className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="place-modal-title">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 id="place-modal-title" className="text-xl font-semibold">{place.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar detalles del lugar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <section className="p-6 space-y-6">
          {/* Image */}
          <figure className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img
              src={getImageSrc(place.link_image, 'place')}
              alt={`Imagen principal de ${place.name} - ${place.description}`}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, 'place')}
            />
            <figcaption className="sr-only">Imagen representativa de {place.name}</figcaption>
          </figure>

          {/* Rating and Status */}
          <aside className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <address className="font-medium not-italic">{place.location}</address>
            </div>
            <div className="flex items-center gap-2">
              {averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <strong className="font-medium">{averageRating.toFixed(1)}</strong>
                </div>
              )}
              <mark className={`px-2 py-1 rounded-full text-xs font-medium ${
                place.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {place.active ? 'Activo' : 'Inactivo'}
              </mark>
            </div>
          </aside>

          {/* Description */}
          <section>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">{place.description}</p>
          </section>

          {/* Location Details */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación Detallada
            </h3>
            <address className="text-gray-700 mb-2 not-italic">{place.location}</address>
            {place.latitude && place.longitude && (
              <aside className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Coordenadas:</strong> {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                </p>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
                    window.open(url, '_blank');
                  }}
                  aria-describedby="maps-button-desc"
                >
                  Ver en Google Maps →
                  <span id="maps-button-desc" className="sr-only">
                    Abrir la ubicación de {place.name} en Google Maps en una nueva pestaña
                  </span>
                </button>
              </aside>
            )}
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                <strong className="text-sm font-medium">Categoría</strong>
              </div>
              <p className="font-semibold">{place.category}</p>
            </article>

            <article className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <strong className="text-sm font-medium">Registrado</strong>
              </div>
              <p className="font-semibold">
                <time dateTime={place.created_at}>{new Date(place.created_at).toLocaleDateString('es-ES')}</time>
              </p>
            </article>
          </section>

          {/* Reviews */}
          {place.reviews && place.reviews.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reseñas ({place.reviews.length})
              </h3>
              <div className="space-y-3">
                {place.reviews.map((review) => (
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
            <button 
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-describedby="favorite-button-desc"
            >
              Agregar a favoritos
              <span id="favorite-button-desc" className="sr-only">
                Agregar este lugar a tu lista de favoritos
              </span>
            </button>
            <button 
              className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-describedby="share-place-desc"
            >
              Compartir lugar
              <span id="share-place-desc" className="sr-only">
                Compartir la información de este lugar en redes sociales
              </span>
            </button>
          </footer>
        </section>
      </section>
    </div>
  );
}