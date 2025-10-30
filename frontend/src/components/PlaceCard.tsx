import { memo, useCallback, useMemo } from "react";
import { MapPin, Star, Clock, BadgeDollarSign, Users, Heart } from "lucide-react";
import type { Place } from "../types";
import { useUserStore } from "../store/userStore";
import { getImageSrc, handleImageError } from "../utils/imageUtils";
import { useFavorites } from "../hooks/useFavorites";
import LazyImage from "./LazyImage";

type Props = {
  place: Place;
  onInterest?: (p: Place) => void;
  onView?: (p: Place) => void;
};

const PlaceCard = memo(function PlaceCard({ place, onInterest, onView }: Props) {
  const { user } = useUserStore();
  const favorites = useFavorites((state) => state.favorites);

  // Check if place is favorited - depend on favorites array to trigger re-render
  const isFavorite = useMemo(() => {
    return favorites.some(fav => fav.place_id === place.id && fav.active);
  }, [favorites, place.id]);

  const averageRating = useMemo(() => {
    return place.reviews && place.reviews.length > 0
      ? place.reviews.reduce((sum: number, r) => sum + r.rating, 0) / place.reviews.length
      : null;
  }, [place.reviews]);

  // Memoize event handlers
  const handleFavoriteToggle = useCallback(() => {
    if (!user) return;
    onInterest?.(place);
  }, [user, onInterest, place]);

  const handleInterest = useCallback(() => {
    onInterest?.(place);
  }, [onInterest, place]);

  const handleView = useCallback(() => {
    onView?.(place);
  }, [onView, place]);

  // Database fields don't have age/price restrictions for places
  const ages = "Todas las edades";
  const price = "Consultar";

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm border focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
      {/* imagen */}
      <div className="aspect-[16/10] w-full bg-gray-100 relative">
        <LazyImage
          src={getImageSrc(place.link_image, place.name, 'place')}
          alt={`Imagen de ${place.name} - ${place.description}`}
          className="h-full w-full"
          onError={(e) => handleImageError(e, place.name, 'place')}
        />
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isFavorite ? `Quitar ${place.name} de favoritos` : `Agregar ${place.name} a favoritos`}
            aria-pressed={isFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-600'}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* contenido */}
      <section className="p-4 space-y-3">
        {/* título + rating */}
        <header className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{place.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <address className="line-clamp-1 not-italic">{place.location}</address>
            </div>
          </div>
          {averageRating && (
            <div className="flex items-center gap-1 text-amber-600" aria-label={`Calificación: ${averageRating.toFixed(1)} de 5 estrellas`}>
              <Star className="h-5 w-5 fill-amber-500" aria-hidden="true" />
              <strong className="font-medium">
                {averageRating.toFixed(1)}
              </strong>
            </div>
          )}
        </header>

        <p className="text-sm text-gray-700 line-clamp-2">{place.description}</p>

        {/* barras/etiquetas como en el wireframe */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <time>8AM - 6PM</time>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
            <strong>{price}</strong>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <small>{ages}</small>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
            <i className="h-2 w-2 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
            <em>{place.category}</em>
          </div>
        </div>

        {/* botones inferiores */}
        <footer className="pt-2 flex gap-3">
          {user && (
            <button
              className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleInterest}
              aria-label={`Mostrar interés en ${place.name}`}
            >
              Me interesa
            </button>
          )}
          <button
            className={`${user ? 'flex-1' : 'w-full'} rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
            onClick={handleView}
            aria-label={`Ver detalles de ${place.name}`}
          >
            Ver detalles
          </button>
        </footer>
      </section>
    </article>
  );
});

PlaceCard.displayName = 'PlaceCard';

export default PlaceCard;
