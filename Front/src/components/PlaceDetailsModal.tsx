// @ts-ignore
import { useEffect, useState } from "react";
import { X, Star, MapPin, Clock, BadgeDollarSign, Users, StarIcon } from "lucide-react";
import type { Place } from "../types";
import { ApiService, type Review } from "../services/api";

type Props = {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
};

export default function PlaceDetailsModal({ place, isOpen, onClose }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Smart image URL selection based on place name and category
  const getUnsplashImageUrl = () => {
    const placeName = place.name.toLowerCase();
    const category = place.category.toLowerCase();
    
    // Map specific places to appropriate Unsplash images
    if (placeName.includes('cristo') || placeName.includes('concordia')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop';
    }
    if (placeName.includes('palacio') || placeName.includes('portales')) {
      return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop';
    }
    if (placeName.includes('tunari') || placeName.includes('parque nacional')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop';
    }
    if (placeName.includes('mercado') || placeName.includes('cancha')) {
      return 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=1200&h=600&fit=crop';
    }
    if (placeName.includes('teatro')) {
      return 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&h=600&fit=crop';
    }
    if (placeName.includes('laguna') || placeName.includes('alalay')) {
      return 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&h=600&fit=crop';
    }
    
    // Fallback based on category
    switch (category) {
      case 'turismo':
        return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=600&fit=crop';
      case 'cultura':
        return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop';
      case 'entretenimiento':
        return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop';
      case 'gastronomía':
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop';
      case 'naturaleza':
        return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=600&fit=crop';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  useEffect(() => {
    if (isOpen && place.id) {
      loadReviews();
    }
  }, [isOpen, place.id]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedReviews = await ApiService.getPlaceReviews(place.id);
      setReviews(fetchedReviews);
    } catch (err) {
      setError("Error al cargar las reseñas");
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  const ages =
    place.min_age == null && place.max_age == null
      ? "Todas las edades"
      : `${place.min_age ?? 0}+${place.max_age ? ` hasta ${place.max_age}` : ""}`;

  const price =
    place.price_min == null && place.price_max == null
      ? "Gratis / Consultar"
      : place.price_max && place.price_min && place.price_max !== place.price_min
      ? `Bs ${place.price_min} – ${place.price_max}`
      : `Bs ${place.price_min ?? place.price_max}`;

  const averageRating = calculateAverageRating();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          <img
            src={imageError ? getUnsplashImageUrl() : (place.image_url && place.image_url.includes('unsplash.com') ? place.image_url : getUnsplashImageUrl())}
            alt={place.name}
            className="w-full h-64 object-cover"
            onError={handleImageError}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">
                {averageRating > 0 ? averageRating.toFixed(1) : "Sin calificar"}
              </span>
              <span className="text-gray-600 text-sm">
                ({reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"})
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-6">
            {/* Place Info */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{place.name}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span>{place.city ?? "Cochabamba"}</span>
              </div>
              <p className="text-gray-700">{place.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Horario</div>
                  <div className="font-medium">8AM - 6PM</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BadgeDollarSign className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Precio</div>
                  <div className="font-medium">{price}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm text-gray-600">Edades</div>
                  <div className="font-medium">{ages}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <div>
                  <div className="text-sm text-gray-600">Categoría</div>
                  <div className="font-medium">{place.category}</div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                Reseñas y Comentarios ({reviews.length})
              </h2>

              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-600">Cargando reseñas...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {!loading && !error && reviews.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay reseñas todavía.</p>
                  <p className="text-sm">¡Sé el primero en dejar una reseña!</p>
                </div>
              )}

              {!loading && !error && reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">
                            {review.user?.name || "Usuario Anónimo"}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 ml-2">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-amber-600">
                          {review.rating}/5
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex gap-3">
          <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200">
            Guardar en Favoritos
          </button>
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
            Compartir
          </button>
          <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
            Dejar Reseña
          </button>
        </div>
      </div>
    </div>
  );
}