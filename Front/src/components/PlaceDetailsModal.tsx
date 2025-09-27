import { X, MapPin, Star, Calendar, Users } from 'lucide-react';
import type { Place } from '../types';
import { getImageSrc, handleImageError } from '../utils/imageUtils';

type Props = {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
};

export default function PlaceDetailsModal({ place, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const averageRating = place.reviews && place.reviews.length > 0 
    ? place.reviews.reduce((sum: number, r) => sum + r.rating, 0) / place.reviews.length 
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{place.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img
              src={getImageSrc(place.link_image, 'place')}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, 'place')}
            />
          </div>

          {/* Rating and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{place.location}</span>
            </div>
            <div className="flex items-center gap-2">
              {averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                </div>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                place.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {place.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-gray-700">{place.description}</p>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación Detallada
            </h3>
            <p className="text-gray-700 mb-2">{place.location}</p>
            {place.latitude && place.longitude && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Coordenadas:</strong> {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                </p>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  Ver en Google Maps →
                </button>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Categoría</span>
              </div>
              <p className="font-semibold">{place.category}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Registrado</span>
              </div>
              <p className="font-semibold">
                {new Date(place.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Reviews */}
          {place.reviews && place.reviews.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Reseñas ({place.reviews.length})
              </h3>
              <div className="space-y-3">
                {place.reviews.map((review) => (
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
            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Agregar a favoritos
            </button>
            <button className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50">
              Compartir lugar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}